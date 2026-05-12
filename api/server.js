const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { listMonitors, listAlerts, markAlertDelivery, addMonitor, removeMonitor, addCheck } = require('./store');
const { normalizeTarget, targetType, runCheck } = require('./monitor');

const PORT = config.port;
const HOST = config.host;
const CHECK_EVERY_MS = config.checkEveryMs;
const appDir = config.appDir;
let schedulerRunning = false;
let lastSchedulerRun = null;

function commonHeaders(type = 'application/json') {
  return {
    'content-type': `${type}; charset=utf-8`,
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization'
  };
}

function send(res, status, data, type = 'application/json') {
  res.writeHead(status, commonHeaders(type));
  res.end(type === 'application/json' ? JSON.stringify(data, null, 2) : data);
}


function isMutatingRequest(req) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

function isPublicMutation(url) {
  return false;
}

function authorized(req) {
  if (!config.adminToken || !isMutatingRequest(req)) return true;
  const header = req.headers.authorization || '';
  return header === `Bearer ${config.adminToken}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
    });
  });
}

function summary(monitors) {
  const rows = monitors.map((m) => ({
    ...m,
    latest: m.checks[0] || null,
    recent: (m.checks || []).slice(0, 8),
    checks: undefined
  }));
  return {
    generatedAt: new Date().toISOString(),
    security: {
      adminTokenRequired: Boolean(config.adminToken)
    },
    scheduler: {
      enabled: true,
      running: schedulerRunning,
      intervalMs: CHECK_EVERY_MS,
      lastRun: lastSchedulerRun
    },
    total: monitors.length,
    up: rows.filter((m) => m.latest && m.latest.ok).length,
    down: rows.filter((m) => m.latest && !m.latest.ok).length,
    unknown: rows.filter((m) => !m.latest).length,
    monitors: rows,
    alerts: listAlerts(10)
  };
}

function shouldCheck(monitor, now = Date.now()) {
  const latest = monitor.checks && monitor.checks[0];
  if (!latest) return true;
  const intervalMs = Math.max(1, Number(monitor.intervalMinutes || 15)) * 60_000;
  return now - new Date(latest.checkedAt).getTime() >= intervalMs;
}

async function runDueChecks(reason = 'schedule') {
  if (schedulerRunning) return { skipped: true, reason: 'already running' };
  schedulerRunning = true;
  lastSchedulerRun = new Date().toISOString();
  const results = [];

  try {
    const monitors = listMonitors();
    for (const monitor of monitors) {
      if (reason !== 'manual' && !shouldCheck(monitor)) continue;
      const check = await runCheck(monitor.target || monitor.url);
      const { alert } = addCheck(monitor.id, { ...check, reason });
      if (alert) console.log(`ALERT ${alert.to.toUpperCase()}: ${alert.message} — ${alert.detail}`);
      results.push({ id: monitor.id, name: monitor.name, ok: check.ok, message: check.message, responseTimeMs: check.responseTimeMs, alert });
    }
    return { skipped: false, checked: results.length, results };
  } finally {
    schedulerRunning = false;
  }
}

function startScheduler() {
  if (!config.schedulerEnabled) {
    console.log('Automatic checks disabled');
    return;
  }
  setTimeout(() => runDueChecks('startup').catch((error) => console.error('startup checks failed', error)), 500);
  setInterval(() => runDueChecks('schedule').catch((error) => console.error('scheduled checks failed', error)), CHECK_EVERY_MS);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'OPTIONS') {
      res.writeHead(204, commonHeaders());
      return res.end();
    }
    if (!authorized(req) && !isPublicMutation(url)) {
      return send(res, 401, { error: 'Admin token required' });
    }

    if (req.method === 'GET' && url.pathname === '/healthz') {
      return send(res, 200, { ok: true, app: config.appName, env: config.env, uptimeSeconds: Math.round(process.uptime()) });
    }

    if (req.method === 'GET' && url.pathname === '/readyz') {
      const monitors = listMonitors();
      return send(res, 200, { ok: true, database: 'ok', monitors: monitors.length, security: { adminTokenRequired: Boolean(config.adminToken) }, scheduler: { enabled: config.schedulerEnabled, running: schedulerRunning, lastRun: lastSchedulerRun } });
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, fs.readFileSync(path.join(appDir, 'index.html'), 'utf8'), 'text/html');
    }

    if (req.method === 'GET' && url.pathname === '/app.js') {
      return send(res, 200, fs.readFileSync(path.join(appDir, 'app.js'), 'utf8'), 'text/javascript');
    }

    if (req.method === 'GET' && url.pathname === '/styles.css') {
      return send(res, 200, fs.readFileSync(path.join(appDir, 'styles.css'), 'utf8'), 'text/css');
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && !url.pathname.startsWith('/api/')) {
      const safePath = path.normalize(url.pathname).replace(/^\/+/, '');
      let filePath = path.join(appDir, safePath);
      if (filePath.startsWith(appDir) && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (filePath.startsWith(appDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const type = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.js' ? 'text/javascript' : 'application/octet-stream';
        return send(res, 200, req.method === 'HEAD' ? '' : fs.readFileSync(filePath, 'utf8'), type);
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/monitors') {
      return send(res, 200, { monitors: listMonitors() });
    }

    if (req.method === 'GET' && url.pathname === '/api/summary') {
      return send(res, 200, summary(listMonitors()));
    }

    if (req.method === 'GET' && url.pathname === '/api/alerts') {
      return send(res, 200, { alerts: listAlerts(50, { pendingOnly: url.searchParams.get('pending') === '1' }) });
    }

    const alertDeliveryMatch = url.pathname.match(/^\/api\/alerts\/([^/]+)\/delivery$/);
    if (req.method === 'POST' && alertDeliveryMatch) {
      const body = await readBody(req);
      const alert = markAlertDelivery(alertDeliveryMatch[1], { status: body.status || 'delivered', error: body.error || null });
      return send(res, alert ? 200 : 404, alert ? { alert } : { error: 'Alert not found' });
    }

    if (req.method === 'POST' && url.pathname === '/api/check-due') {
      return send(res, 200, await runDueChecks('manual'));
    }

    if (req.method === 'POST' && url.pathname === '/api/monitors') {
      const body = await readBody(req);
      const cleanTarget = normalizeTarget(body.target || body.url);
      const monitor = addMonitor({ name: body.name, target: cleanTarget, type: targetType(cleanTarget) });
      const check = await runCheck(cleanTarget);
      const { alert } = addCheck(monitor.id, check);
      return send(res, 201, { monitor: { ...monitor, checks: [check] }, alert });
    }

    const checkMatch = url.pathname.match(/^\/api\/check\/([^/]+)$/);
    if (req.method === 'POST' && checkMatch) {
      const id = checkMatch[1];
      const monitor = listMonitors().find((m) => m.id === id);
      if (!monitor) return send(res, 404, { error: 'Monitor not found' });
      const check = await runCheck(monitor.target || monitor.url);
      const { monitor: updated, alert } = addCheck(id, check);
      return send(res, 200, { monitor: updated, check, alert });
    }

    const deleteMatch = url.pathname.match(/^\/api\/monitors\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const removed = removeMonitor(deleteMatch[1]);
      return send(res, removed ? 200 : 404, { removed });
    }

    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    return send(res, 400, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`PulsePage ${config.env} running at http://${HOST}:${PORT}`);
  console.log(`Database: ${config.dbFile}`);
  console.log(`Automatic checks ${config.schedulerEnabled ? `enabled every ${Math.round(CHECK_EVERY_MS / 1000)}s` : 'disabled'}`);
  startScheduler();
});
