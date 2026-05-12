# Security Policy

PulsePage is an early MVP. Security matters because the app can monitor user websites and server ports.

## Supported versions

Only the latest `main` branch is currently supported during MVP development.

## Reporting a vulnerability

Do not open public GitHub issues for secrets, account access problems, or exploitable vulnerabilities.

For now, report privately to the project owner before public disclosure.

## Current security posture

- No production secrets should be committed to this repository.
- Runtime monitor data is ignored by Git.
- Production admin actions should require `PULSEPAGE_ADMIN_TOKEN`.
- The backend should bind to localhost behind a reverse proxy unless intentionally exposed.
- Mutating API routes must remain protected.

## Security expectations before production

- Keep dependency updates reviewed and tested.
- Keep admin tokens long, random, and outside Git.
- Add rate limiting before broad public usage.
- Restrict CORS once final app/domain needs are clear.
- Maintain server backups/snapshots.
- Harden SSH and firewall on production infrastructure.
