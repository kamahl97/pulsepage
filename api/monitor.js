const net = require('net');
const tls = require('tls');

function normalizeTarget(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('Target is required');

  if (/^tcp:\/\//i.test(trimmed)) {
    const target = new URL(trimmed);
    if (!target.hostname || !target.port) throw new Error('Server monitors need a host and port, like 31.220.56.145:22.');
    const port = Number(target.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Server port must be a number from 1 to 65535. Example: 31.220.56.145:22.');
    return target.toString();
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error('Website must look like example.com or https://example.com.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only website URLs and server ports are supported.');
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') throw new Error('Website must include a real domain, like example.com. For server ports, choose Server port instead.');
  return url.toString();
}

function targetType(target) {
  return target.startsWith('tcp://') ? 'tcp' : 'http';
}

async function checkHttp(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'PulsePageBot/0.1 (+https://pulsepage.local)' }
    });
    const responseTimeMs = Date.now() - started;
    return {
      type: 'http',
      ok: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      responseTimeMs,
      message: response.status >= 200 && response.status < 400 ? 'Website is up' : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      type: 'http',
      ok: false,
      statusCode: null,
      responseTimeMs: Date.now() - started,
      message: error.name === 'AbortError' ? 'Website timed out' : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

function checkTcp(target) {
  return new Promise((resolve) => {
    const url = new URL(target);
    const started = Date.now();
    const socket = net.connect({ host: url.hostname, port: Number(url.port), timeout: 8000 });

    function finish(ok, message) {
      socket.destroy();
      resolve({
        type: 'tcp',
        ok,
        statusCode: null,
        responseTimeMs: Date.now() - started,
        message
      });
    }

    socket.on('connect', () => finish(true, `Port ${url.port} is reachable`));
    socket.on('timeout', () => finish(false, `Port ${url.port} timed out`));
    socket.on('error', (error) => finish(false, error.code || error.message));
  });
}

function checkCertificate(urlString) {
  return new Promise((resolve) => {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return resolve(null);

    const socket = tls.connect({
      host: url.hostname,
      port: url.port ? Number(url.port) : 443,
      servername: url.hostname,
      rejectUnauthorized: false,
      timeout: 8000
    }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert || !cert.valid_to) return resolve(null);
      const expiresAt = new Date(cert.valid_to);
      const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
      resolve({ expiresAt: expiresAt.toISOString(), daysRemaining });
    });

    socket.on('timeout', () => { socket.destroy(); resolve(null); });
    socket.on('error', () => resolve(null));
  });
}

async function runCheck(inputTarget) {
  const target = normalizeTarget(inputTarget);
  const type = targetType(target);
  const [base, certificate] = type === 'tcp'
    ? [await checkTcp(target), null]
    : await Promise.all([checkHttp(target), checkCertificate(target)]);

  const check = {
    checkedAt: new Date().toISOString(),
    target,
    url: target,
    ...base,
    certificate
  };

  if (certificate && certificate.daysRemaining <= 14) {
    check.ok = false;
    check.message = `SSL expires in ${certificate.daysRemaining} days`;
  }

  if (check.ok && check.responseTimeMs > 2000) {
    check.message = `Slow (${check.responseTimeMs}ms)`;
  }

  return check;
}

module.exports = { normalizeTarget, normalizeUrl: normalizeTarget, targetType, runCheck };
