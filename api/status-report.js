#!/usr/bin/env node
const { listMonitors, listAlerts } = require('./store');

function statusWord(check) {
  if (!check) return 'UNKNOWN';
  return check.ok ? 'UP' : 'DOWN';
}

function statusEmoji(check) {
  if (!check) return '⚪';
  return check.ok ? '✅' : '🚨';
}

function formatAge(iso) {
  if (!iso) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function report() {
  const monitors = listMonitors();
  const alerts = listAlerts(5, { pendingOnly: true });
  const up = monitors.filter((m) => m.checks[0] && m.checks[0].ok).length;
  const down = monitors.filter((m) => m.checks[0] && !m.checks[0].ok).length;
  const unknown = monitors.filter((m) => !m.checks[0]).length;

  const lines = [];
  lines.push(`PulsePage status: ${up}/${monitors.length} up`);
  if (down) lines.push(`🚨 Down monitors: ${down}`);
  if (unknown) lines.push(`⚪ Unknown monitors: ${unknown}`);
  if (!down && !unknown) lines.push('All known monitors are healthy ✅');
  lines.push('');

  for (const monitor of monitors) {
    const latest = monitor.checks[0];
    const target = monitor.target || monitor.url;
    lines.push(`${statusEmoji(latest)} ${monitor.name}`);
    lines.push(`   ${statusWord(latest)} · ${target}`);
    if (latest) {
      lines.push(`   ${latest.message} · ${latest.responseTimeMs}ms · ${formatAge(latest.checkedAt)}`);
      if (latest.certificate) lines.push(`   SSL: ${latest.certificate.daysRemaining} days left`);
    } else {
      lines.push('   No checks yet');
    }
  }

  lines.push('');
  if (alerts.length) {
    lines.push(`Pending alerts: ${alerts.length}`);
    for (const alert of alerts) lines.push(`- ${alert.message}: ${alert.detail}`);
  } else {
    lines.push('Pending alerts: 0');
  }

  return lines.join('\n');
}

console.log(report());
