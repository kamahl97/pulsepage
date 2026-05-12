# VPS Security Hardening Plan

This plan is based on the read-only audit performed on the PulsePage/OpenClaw VPS.

## Current known-good posture

- OS: Ubuntu 24.04 LTS on public VPS.
- OpenClaw gateway is localhost-only, not publicly reachable.
- PulsePage backend is localhost-only behind Caddy.
- Public ports observed: 22, 80, 443.
- PulsePage admin token is set.
- Unauthenticated mutating PulsePage API test returned 401.
- OpenClaw is up to date.
- Unattended upgrades are enabled/running.

## Main risk

SSH is publicly reachable and effective SSH config currently allows:

- `PermitRootLogin yes`
- `PasswordAuthentication yes`
- `X11Forwarding yes`

This should be hardened carefully to avoid lockout.

## Target posture

- SSH key-only authentication.
- No direct root SSH login.
- Password authentication disabled.
- X11 forwarding disabled.
- Firewall/provider firewall allows only required public ports.
- Backups/snapshots verified.

## Access-preservation strategy

Before changing SSH:

1. Confirm at least one non-root sudo user exists or create one.
2. Confirm that user's SSH public key works in a separate session.
3. Keep the current root SSH session open while testing new login.
4. Only then disable root/password login.
5. Reload SSH instead of restarting when possible.
6. Verify a second login works after changes.

## Draft commands — do not run without explicit approval

Create/verify a sudo deploy user, if needed:

```bash
adduser kam
usermod -aG sudo kam
install -d -m 700 -o kam -g kam /home/kam/.ssh
cp /root/.ssh/authorized_keys /home/kam/.ssh/authorized_keys
chown kam:kam /home/kam/.ssh/authorized_keys
chmod 600 /home/kam/.ssh/authorized_keys
```

Create SSH hardening override:

```bash
cat >/etc/ssh/sshd_config.d/99-hardening.conf <<'CONF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 3
CONF
sshd -t
systemctl reload ssh
```

Rollback if needed from an existing root session:

```bash
rm -f /etc/ssh/sshd_config.d/99-hardening.conf
sshd -t
systemctl reload ssh
```

## OpenClaw hardening follow-ups

- Disable `gateway.controlUi.allowInsecureAuth` when not actively debugging.
- Keep Control UI local-only unless using a secure tunnel.
- Keep Discord/group access allowlisted and only for trusted operators.
- Consider pinning plugin install versions for supply-chain stability.

## PulsePage follow-ups

- Keep `PULSEPAGE_ADMIN_TOKEN` set in production.
- Add rate limiting before broader public launch.
- Restrict CORS after app/domain needs are final.
- Remove public AAB download when Play Console no longer needs it.
