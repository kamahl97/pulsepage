#!/usr/bin/env node
const { listAlerts } = require('./store');
const { formatAlertDigest } = require('./format-alerts');

const alerts = listAlerts(10, { pendingOnly: true });
const digest = formatAlertDigest(alerts);
console.log(digest);
process.exit(alerts.length ? 2 : 0);
