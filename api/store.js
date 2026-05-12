const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

const dataDir = config.dataDir;
const legacyFile = config.legacyJsonFile;
const dbFile = config.dbFile;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function defaultData() {
  return {
    alerts: [],
    monitors: [
      {
        id: 'randy-vps-ssh',
        name: "Randy's VPS SSH",
        target: 'tcp://31.220.56.145:22',
        url: 'tcp://31.220.56.145:22',
        type: 'tcp',
        intervalMinutes: 15,
        createdAt: new Date().toISOString(),
        checks: []
      },
      {
        id: 'example-site',
        name: 'Example Website',
        target: 'https://example.com/',
        url: 'https://example.com/',
        type: 'http',
        intervalMinutes: 15,
        createdAt: new Date().toISOString(),
        checks: []
      }
    ]
  };
}

ensureDataDir();
const db = new DatabaseSync(dbFile);

db.exec(`
CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monitor_id TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  target TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  ok INTEGER NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER NOT NULL,
  message TEXT NOT NULL,
  certificate_json TEXT,
  reason TEXT,
  FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_checks_monitor_time ON checks(monitor_id, checked_at DESC);
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  monitor_id TEXT NOT NULL,
  monitor_name TEXT NOT NULL,
  target TEXT NOT NULL,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  message TEXT NOT NULL,
  detail TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at TEXT,
  last_attempt_at TEXT,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
`);

function rowToMonitor(row, checks = []) {
  return {
    id: row.id,
    name: row.name,
    target: row.target,
    url: row.url,
    type: row.type,
    intervalMinutes: row.interval_minutes,
    createdAt: row.created_at,
    checks
  };
}

function rowToCheck(row) {
  return {
    checkedAt: row.checked_at,
    target: row.target,
    url: row.url,
    type: row.type,
    ok: Boolean(row.ok),
    statusCode: row.status_code,
    responseTimeMs: row.response_time_ms,
    message: row.message,
    certificate: row.certificate_json ? JSON.parse(row.certificate_json) : null,
    reason: row.reason || undefined
  };
}

function rowToAlert(row) {
  return {
    id: row.id,
    monitorId: row.monitor_id,
    monitorName: row.monitor_name,
    target: row.target,
    from: row.from_state,
    to: row.to_state,
    message: row.message,
    detail: row.detail,
    responseTimeMs: row.response_time_ms,
    createdAt: row.created_at,
    acknowledged: Boolean(row.acknowledged),
    delivery: {
      status: row.delivery_status,
      attempts: row.delivery_attempts,
      deliveredAt: row.delivered_at,
      lastAttemptAt: row.last_attempt_at,
      lastError: row.last_error
    }
  };
}

const insertMonitorStmt = db.prepare(`
INSERT OR IGNORE INTO monitors (id, name, target, url, type, interval_minutes, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertCheckStmt = db.prepare(`
INSERT INTO checks (monitor_id, checked_at, target, url, type, ok, status_code, response_time_ms, message, certificate_json, reason)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAlertStmt = db.prepare(`
INSERT INTO alerts (id, monitor_id, monitor_name, target, from_state, to_state, message, detail, response_time_ms, created_at, acknowledged, delivery_status, delivery_attempts, delivered_at, last_attempt_at, last_error)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertMonitor(monitor) {
  insertMonitorStmt.run(
    monitor.id,
    monitor.name,
    monitor.target || monitor.url,
    monitor.url || monitor.target,
    monitor.type || (String(monitor.target || monitor.url).startsWith('tcp://') ? 'tcp' : 'http'),
    Number(monitor.intervalMinutes || monitor.interval_minutes || 15),
    monitor.createdAt || monitor.created_at || new Date().toISOString()
  );
}

function insertCheck(monitorId, check) {
  insertCheckStmt.run(
    monitorId,
    check.checkedAt || check.checked_at || new Date().toISOString(),
    check.target || check.url,
    check.url || check.target,
    check.type || (String(check.target || check.url).startsWith('tcp://') ? 'tcp' : 'http'),
    check.ok ? 1 : 0,
    check.statusCode ?? check.status_code ?? null,
    Number(check.responseTimeMs || check.response_time_ms || 0),
    check.message || '',
    check.certificate ? JSON.stringify(check.certificate) : null,
    check.reason || null
  );
}

function insertAlert(alert) {
  const delivery = alert.delivery || { status: 'pending', attempts: 0, deliveredAt: null, lastAttemptAt: null, lastError: null };
  insertAlertStmt.run(
    alert.id,
    alert.monitorId || alert.monitor_id,
    alert.monitorName || alert.monitor_name,
    alert.target,
    alert.from || alert.from_state,
    alert.to || alert.to_state,
    alert.message,
    alert.detail,
    Number(alert.responseTimeMs || alert.response_time_ms || 0),
    alert.createdAt || alert.created_at || new Date().toISOString(),
    alert.acknowledged ? 1 : 0,
    delivery.status || 'pending',
    Number(delivery.attempts || 0),
    delivery.deliveredAt || delivery.delivered_at || null,
    delivery.lastAttemptAt || delivery.last_attempt_at || null,
    delivery.lastError || delivery.last_error || null
  );
}

function monitorCount() {
  return db.prepare('SELECT COUNT(*) AS count FROM monitors').get().count;
}

function seedDefaultsIfEmpty() {
  if (monitorCount() > 0) return;
  for (const monitor of defaultData().monitors) insertMonitor(monitor);
}

function migrateLegacyJsonIfNeeded() {
  if (monitorCount() > 0 || !fs.existsSync(legacyFile)) return;
  const legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
  for (const monitor of legacy.monitors || []) {
    insertMonitor(monitor);
    for (const check of (monitor.checks || []).slice().reverse()) insertCheck(monitor.id, check);
  }
  for (const alert of legacy.alerts || []) insertAlert(alert);
  const backup = `${legacyFile}.migrated-${Date.now()}.bak`;
  fs.copyFileSync(legacyFile, backup);
}

migrateLegacyJsonIfNeeded();
seedDefaultsIfEmpty();

function checksForMonitor(id, limit = 100) {
  return db.prepare('SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC, id DESC LIMIT ?').all(id, limit).map(rowToCheck);
}

function listMonitors() {
  return db.prepare('SELECT * FROM monitors ORDER BY created_at ASC').all().map((row) => rowToMonitor(row, checksForMonitor(row.id)));
}

function listAlerts(limit = 20, options = {}) {
  const sql = options.pendingOnly
    ? "SELECT * FROM alerts WHERE delivery_status != 'delivered' ORDER BY created_at DESC LIMIT ?"
    : 'SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?';
  return db.prepare(sql).all(limit).map(rowToAlert);
}

function markAlertDelivery(id, { status, error = null }) {
  const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE alerts
    SET delivery_status = ?, delivery_attempts = delivery_attempts + 1, delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END, last_attempt_at = ?, last_error = ?
    WHERE id = ?
  `).run(status, status, now, now, error, id);
  return rowToAlert(db.prepare('SELECT * FROM alerts WHERE id = ?').get(id));
}

function addMonitor({ name, target, url, type }) {
  const monitorTarget = target || url;
  const monitor = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || new URL(monitorTarget).hostname,
    target: monitorTarget,
    url: monitorTarget,
    type,
    intervalMinutes: 15,
    createdAt: new Date().toISOString(),
    checks: []
  };
  insertMonitor(monitor);
  return monitor;
}

function removeMonitor(id) {
  const info = db.prepare('DELETE FROM monitors WHERE id = ?').run(id);
  return info.changes > 0;
}

function addCheck(id, check) {
  const row = db.prepare('SELECT * FROM monitors WHERE id = ?').get(id);
  if (!row) return null;
  const previousRow = db.prepare('SELECT * FROM checks WHERE monitor_id = ? ORDER BY checked_at DESC, id DESC LIMIT 1').get(id);
  const previous = previousRow ? rowToCheck(previousRow) : null;
  insertCheck(id, check);

  let alert = null;
  if (previous && previous.ok !== check.ok) {
    alert = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      monitorId: row.id,
      monitorName: row.name,
      target: row.target || row.url,
      from: previous.ok ? 'up' : 'down',
      to: check.ok ? 'up' : 'down',
      message: check.ok ? `${row.name} recovered` : `${row.name} is down`,
      detail: check.message,
      responseTimeMs: check.responseTimeMs,
      createdAt: check.checkedAt || new Date().toISOString(),
      acknowledged: false,
      delivery: { status: 'pending', attempts: 0, deliveredAt: null, lastAttemptAt: null, lastError: null }
    };
    insertAlert(alert);
  }

  return { monitor: rowToMonitor(row, checksForMonitor(id)), alert };
}

module.exports = { listMonitors, listAlerts, markAlertDelivery, addMonitor, removeMonitor, addCheck };
