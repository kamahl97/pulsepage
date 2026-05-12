#!/usr/bin/env node
const { listAlerts, markAlertDelivery } = require('./store');
const { formatAlertDigest } = require('./format-alerts');

const mark = process.argv.includes('--mark-delivered');
const alerts = listAlerts(10, { pendingOnly: true });
console.log(formatAlertDigest(alerts));

if (mark) {
  for (const alert of alerts) markAlertDelivery(alert.id, { status: 'delivered' });
}

process.exit(alerts.length ? 2 : 0);
