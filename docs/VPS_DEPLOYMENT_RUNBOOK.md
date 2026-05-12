# PulsePage VPS Deployment Runbook

This is the safe deployment plan for Randy's Hostinger VPS. Do not run these steps without explicit approval.

## Goal
Run PulsePage privately on the VPS as a systemd service bound to `127.0.0.1:4177`.

## Safety rules
- Do not expose PulsePage publicly until HTTPS/password/auth plan is ready.
- Keep the app bound to localhost first.
- Keep SQLite data in `/var/lib/pulsepage`.
- Use a non-root service user named `pulsepage`.
- Back up current deployment before replacing it.

## Files prepared
- `scripts/make-release.sh` builds a release tarball.
- `deploy/systemd/pulsepage.service` is the systemd service draft.
- `deploy/pulsepage.env.example` is the production env draft.
- `deploy/nginx/pulsepage.conf` is a later reverse-proxy draft, not for immediate enablement.

## First deployment outline
1. Build release locally:
   ```bash
   ./scripts/make-release.sh
   ```
2. Copy tarball to VPS.
3. On VPS, create service user and directories:
   ```bash
   useradd --system --home /var/lib/pulsepage --shell /usr/sbin/nologin pulsepage
   mkdir -p /opt/pulsepage/releases /var/lib/pulsepage /etc/pulsepage
   chown -R pulsepage:pulsepage /var/lib/pulsepage
   ```
4. Extract release to `/opt/pulsepage/releases/<version>`.
5. Symlink `/opt/pulsepage/current` to the release.
6. Create `/etc/pulsepage/pulsepage.env` from example and set a real admin token.
7. Install dependencies with production mode.
8. Install systemd unit.
9. Start service.
10. Verify:
    ```bash
    curl http://127.0.0.1:4177/healthz
    curl http://127.0.0.1:4177/readyz
    systemctl status pulsepage --no-pager
    ```

## Rollback outline
1. Stop service:
   ```bash
   systemctl stop pulsepage
   ```
2. Point `/opt/pulsepage/current` back to previous release.
3. Start service:
   ```bash
   systemctl start pulsepage
   ```
4. Re-check health endpoints.

## Later public access
Only after private service works:
- Add domain/subdomain.
- Add HTTPS reverse proxy.
- Keep admin-token protection.
- Consider user accounts before broad public access.
