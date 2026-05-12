const path = require('path');

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function boolFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

const rootDir = path.join(__dirname, '..');
const dataDir = process.env.PULSEPAGE_DATA_DIR || path.join(__dirname, 'data');

module.exports = {
  appName: 'PulsePage',
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || process.env.PULSEPAGE_HOST || '127.0.0.1',
  port: numberFromEnv('PORT', numberFromEnv('PULSEPAGE_PORT', 4177)),
  checkEveryMs: numberFromEnv('CHECK_EVERY_MS', numberFromEnv('PULSEPAGE_CHECK_EVERY_MS', 60_000)),
  schedulerEnabled: boolFromEnv('PULSEPAGE_SCHEDULER_ENABLED', true),
  rootDir,
  appDir: path.join(rootDir, 'app'),
  dataDir,
  dbFile: process.env.PULSEPAGE_DB_FILE || path.join(dataDir, 'pulsepage.sqlite'),
  adminToken: process.env.PULSEPAGE_ADMIN_TOKEN || '',
  legacyJsonFile: process.env.PULSEPAGE_LEGACY_JSON_FILE || path.join(dataDir, 'pulsepage.json')
};
