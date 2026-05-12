# PulsePage Deployment Plan

This is the safe plan for running PulsePage 24/7 on Randy's Hostinger VPS later.

## Current recommendation
Do not expose PulsePage publicly yet. Run it on `127.0.0.1:4177` first, then put HTTPS/password auth in front when ready.

## Environment
Copy `.env.example` to `.env` and adjust values.

Important defaults:
- Host: `127.0.0.1`
- Port: `4177`
- Scheduler: enabled
- Database: `api/data/pulsepage.sqlite`

## Health checks
- `GET /healthz` — app process is alive
- `GET /readyz` — database and scheduler status

## Future VPS steps
These require explicit approval before I run them:
1. Install/copy PulsePage to `/opt/pulsepage` or `/srv/pulsepage`.
2. Create a non-root service user, e.g. `pulsepage`.
3. Create `/var/lib/pulsepage` for the SQLite database.
4. Add a systemd service running `node api/server.js`.
5. Keep it bound to `127.0.0.1`.
6. Add Nginx/Caddy HTTPS reverse proxy later.
7. Open only needed firewall ports in The Great Wall.

## Example systemd unit draft

```ini
[Unit]
Description=PulsePage uptime monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pulsepage
WorkingDirectory=/opt/pulsepage
Environment=NODE_ENV=production
Environment=PULSEPAGE_HOST=127.0.0.1
Environment=PULSEPAGE_PORT=4177
Environment=PULSEPAGE_DATA_DIR=/var/lib/pulsepage
ExecStart=/usr/bin/node api/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Admin token

Set `PULSEPAGE_ADMIN_TOKEN` in production. When set, mutating API actions like adding monitors, deleting monitors, manual checks, and marking alerts delivered require:

```http
Authorization: Bearer <token>
```

This keeps the private backend from being open to random users while we are still in MVP mode.
