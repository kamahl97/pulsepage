function formatAlert(alert) {
  const emoji = alert.to === 'up' ? '✅' : '🚨';
  const state = alert.to === 'up' ? 'RECOVERED' : 'DOWN';
  return `${emoji} PulsePage alert: ${state}\n` +
    `Monitor: ${alert.monitorName}\n` +
    `Target: ${alert.target}\n` +
    `Detail: ${alert.detail}\n` +
    `Time: ${alert.createdAt}`;
}

function formatAlertDigest(alerts) {
  if (!alerts.length) return 'No pending PulsePage alerts.';
  return alerts.map(formatAlert).join('\n\n');
}

module.exports = { formatAlert, formatAlertDigest };
