const monitorsEl = document.querySelector('#monitors');
const alertsEl = document.querySelector('#alerts');
const scoreEl = document.querySelector('#score');
const statTotal = document.querySelector('#statTotal');
const statUp = document.querySelector('#statUp');
const statDown = document.querySelector('#statDown');
const statAlerts = document.querySelector('#statAlerts');
const typeButtons = document.querySelectorAll('.type-option');
const targetLabel = document.querySelector('#targetLabel');
const targetHint = document.querySelector('#targetHint');
const targetInput = document.querySelector('#url');
const apiBaseInput = document.querySelector('#apiBaseInput');
const adminTokenInput = document.querySelector('#adminTokenInput');
const saveSettingsButton = document.querySelector('#saveSettings');
const addButton = document.querySelector('#add');
const connectionState = document.querySelector('#connectionState');
const settingsHint = document.querySelector('#settingsHint');
let monitorType = 'website';
let adminTokenRequired = false;
let API_BASE = (localStorage.getItem('pulsepage.apiBaseUrl') || window.PULSEPAGE_API_BASE_URL || '').replace(/\/$/, '');
let ADMIN_TOKEN = localStorage.getItem('pulsepage.adminToken') || window.PULSEPAGE_ADMIN_TOKEN || '';
const apiUrl = (path) => `${API_BASE}${path}`;
const authHeaders = () => ADMIN_TOKEN ? { authorization: `Bearer ${ADMIN_TOKEN}` } : {};

function hydrateSettings() {
  apiBaseInput.value = API_BASE;
  adminTokenInput.value = ADMIN_TOKEN;
}

function saveSettings() {
  API_BASE = apiBaseInput.value.trim().replace(/\/$/, '');
  ADMIN_TOKEN = adminTokenInput.value.trim();
  localStorage.setItem('pulsepage.apiBaseUrl', API_BASE);
  localStorage.setItem('pulsepage.adminToken', ADMIN_TOKEN);
  settingsHint.textContent = 'Saved. Rechecking connection…';
  load();
}

function statusClass(latest) {
  if (!latest) return 'unknown';
  return latest.ok ? 'up' : 'down';
}

function statusText(latest) {
  if (!latest) return 'Unknown';
  return latest.ok ? 'Up' : 'Down';
}

function setMonitorType(type) {
  monitorType = type;
  typeButtons.forEach((button) => button.classList.toggle('active', button.dataset.type === type));
  if (type === 'server') {
    targetLabel.textContent = 'Server IP/domain + port';
    targetInput.placeholder = '31.220.56.145:22';
    targetHint.textContent = 'Tip: use an IP/domain plus port. Example: 31.220.56.145:22. PulsePage turns it into a server-port monitor.';
  } else {
    targetLabel.textContent = 'Website URL';
    targetInput.placeholder = 'example.com';
    targetHint.textContent = 'Tip: paste a website like example.com or https://example.com. PulsePage will clean it up.';
  }
}

function buildTarget(raw) {
  const value = raw.trim();
  if (monitorType === 'server') {
    if (/^tcp:\/\//i.test(value)) return value;
    return `tcp://${value}`;
  }
  return value;
}

function formatWhen(iso) {
  if (!iso) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function canControl() {
  return !adminTokenRequired || Boolean(ADMIN_TOKEN);
}

function controlHint() {
  if (!adminTokenRequired) return 'Full control enabled.';
  return ADMIN_TOKEN ? 'Full control enabled with saved admin token.' : 'View-only mode. Paste the admin token to add, delete, or check monitors.';
}

function updateControlState() {
  addButton.disabled = !canControl();
  addButton.textContent = canControl() ? 'Add monitor' : 'Admin token needed';
}

function render(summary) {
  adminTokenRequired = Boolean(summary.security && summary.security.adminTokenRequired);
  updateControlState();
  const alertCount = (summary.alerts || []).length;
  scoreEl.textContent = `${summary.up}/${summary.total}`;
  statTotal.textContent = summary.total;
  statUp.textContent = summary.up;
  statDown.textContent = summary.down;
  statAlerts.textContent = alertCount;

  alertsEl.innerHTML = alertCount
    ? summary.alerts.map((alert) => `<div class="alert ${alert.to === 'up' ? 'alert-up' : 'alert-down'}">
        <strong>${escapeHtml(alert.message)}</strong>
        <span>${escapeHtml(alert.detail)} · ${formatWhen(alert.createdAt)}</span>
      </div>`).join('')
    : '<div class="empty">No recent alerts. Quiet is good.</div>';

  monitorsEl.innerHTML = summary.monitors.length
    ? summary.monitors.map(renderMonitor).join('')
    : '<article class="card empty-state">No monitors yet. Add your first website or server above.</article>';
}

function renderMonitor(m) {
  const latest = m.latest;
  const cert = latest && latest.certificate ? `<span>SSL ${latest.certificate.daysRemaining} days left</span>` : '';
  const type = m.type === 'tcp' ? 'Server port' : 'Website';
  const icon = m.type === 'tcp' ? '🖥️' : '🌐';
  const history = (m.recent || []).slice(0, 10).map((check) => `<span class="dot ${check.ok ? 'dot-up' : 'dot-down'}" title="${escapeHtml(check.message)} · ${check.responseTimeMs}ms"></span>`).join('');
  return `<article class="card monitor ${statusClass(latest)}-card">
    <div class="monitor-top">
      <div class="badge">${icon} ${type}</div>
      <div class="status-chip ${statusClass(latest)}">${statusText(latest)}</div>
    </div>
    <h2>${escapeHtml(m.name)}</h2>
    <div class="url">${escapeHtml(m.target || m.url)}</div>
    <div class="big-status ${statusClass(latest)}">${latest ? `${latest.responseTimeMs}ms` : '—'}</div>
    <div class="meta-list">
      <span>${latest ? escapeHtml(latest.message) : 'No checks yet'}</span>
      <span>${latest ? `Checked ${formatWhen(latest.checkedAt)}` : 'Waiting for first check'}</span>
      ${cert}
    </div>
    <div class="history" aria-label="Recent check history">${history || '<span class="meta">No history yet</span>'}</div>
    <div class="actions">
      <button class="secondary" ${canControl() ? '' : 'disabled'} onclick="checkNow('${m.id}')">Check now</button>
      <button class="danger" ${canControl() ? '' : 'disabled'} onclick="removeMonitor('${m.id}')">Delete</button>
    </div>
  </article>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

async function load() {
  connectionState.textContent = 'checking…';
  try {
    const res = await fetch(apiUrl('/api/summary'));
    if (!res.ok) throw new Error(res.status === 401 ? 'Admin token required' : 'Could not load PulsePage status');
    const summary = await res.json();
    connectionState.textContent = canControl() ? 'connected' : 'view-only';
    settingsHint.textContent = `${API_BASE ? `Connected to ${API_BASE}` : 'Connected in same-server mode.'} ${controlHint()}`;
    render(summary);
  } catch (error) {
    connectionState.textContent = 'offline';
    adminTokenRequired = false;
    updateControlState();
    settingsHint.textContent = API_BASE ? 'Check the API URL/token, then save again.' : 'If this is Android, enter the hosted API URL above.';
    alertsEl.innerHTML = `<div class="alert alert-down"><strong>Could not load status</strong><span>${escapeHtml(error.message)}</span></div>`;
    monitorsEl.innerHTML = '<article class="card empty-state">PulsePage API is not reachable.</article>';
  }
}

async function checkNow(id) {
  if (!canControl()) return alert('Paste and save the admin token first. Viewing works without it; changes need it.');
  const res = await fetch(apiUrl(`/api/check/${id}`), { method: 'POST', headers: authHeaders() });
  if (!res.ok) alert((await safeJson(res)).error || 'Check failed');
  await load();
}

async function removeMonitor(id) {
  if (!canControl()) return alert('Paste and save the admin token first. Viewing works without it; changes need it.');
  if (!confirm('Delete this monitor?')) return;
  const res = await fetch(apiUrl(`/api/monitors/${id}`), { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) alert((await safeJson(res)).error || 'Delete failed');
  await load();
}

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

typeButtons.forEach((button) => button.addEventListener('click', () => setMonitorType(button.dataset.type)));

document.querySelector('#add').addEventListener('click', async () => {
  if (!canControl()) return alert('Paste and save the admin token first. Viewing works without it; changes need it.');
  const name = document.querySelector('#name').value;
  const rawTarget = targetInput.value;
  if (!rawTarget.trim()) return alert(monitorType === 'server' ? 'Add a server and port first, like 31.220.56.145:22.' : 'Add a website first, like example.com.');

  const res = await fetch(apiUrl('/api/monitors'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, target: buildTarget(rawTarget) })
  });
  if (!res.ok) {
    const error = await safeJson(res);
    return alert(error.error || 'Something went wrong');
  }
  document.querySelector('#name').value = '';
  targetInput.value = '';
  await load();
});

saveSettingsButton.addEventListener('click', saveSettings);
hydrateSettings();
setMonitorType('website');
load();
setInterval(load, 30_000);
