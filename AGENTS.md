# AGENTS.md - PulsePage Project Instructions

This repo is PulsePage, Randy/Kam's uptime-monitoring app/business project.

## Current mission

Turn PulsePage from a working MVP into a testable, monetizable Google Play product for side hustlers and small businesses.

## Current status to remember

- GitHub repo: https://github.com/kamahl97/pulsepage
- Hosted site/API domain: https://getpulsepage.com and https://api.getpulsepage.com
- Google Play closed/internal testing release work has already been done.
- Play-installed app was tested successfully.
- VersionCode issue was fixed by rebuilding v2 / 1.0.1.
- Current Play Console blocker: production access requires at least 12 testers opted in to closed testing and a 14-day closed test period.
- Hosted AAB: https://getpulsepage.com/play-console/pulsepage-release-v2.aab
- Privacy policy: https://getpulsepage.com/legal/privacy.html
- Support page: https://getpulsepage.com/support/

## Commands

Run before claiming code changes are good:

```bash
npm test
```

Useful scripts:

```bash
npm start              # run backend/API
npm test               # self-test
npm run status         # status report
npm run alerts         # pending alerts
npm run mobile:sync    # sync Capacitor Android project
```

## Repo structure

- `api/` - Node.js backend/API and monitor logic
- `app/` - web app UI and public legal/support pages
- `android/` - Capacitor Android project
- `deploy/` - deployment drafts for Caddy/systemd/env
- `docs/` - product, launch, Play Console, security, and operations docs
- `play-store-assets/` - Google Play graphics/screenshots
- `research/` - research notes

## Security rules

- Never commit secrets, admin tokens, private keys, keystores, or real runtime monitor data.
- Runtime data under `api/data/*.json` and SQLite files should stay ignored except safe samples.
- Production mutating API actions must require `PULSEPAGE_ADMIN_TOKEN`.
- Backend should stay bound to localhost behind Caddy unless intentionally changed.
- Do not change SSH/firewall/systemd production access without explicit human approval.
- Before broad public launch, add/review rate limiting and tighter CORS.

## Product rules

- Keep PulsePage simple: "Know your site is down before customers do."
- Target users are non-technical side hustlers, freelancers, small businesses, and indie builders.
- Do not overbuild enterprise features before validating demand.
- Do not claim guaranteed uptime or enterprise reliability.
- Avoid paid/billing claims until Google Play Billing/subscriptions are actually implemented.

## Google Play rules

Use docs before answering Play Console questions:

- `docs/play-console/resume-checklist.md`
- `docs/PLAY_STORE_LISTING.md`
- `docs/DATA_SAFETY_DRAFT.md`
- `docs/GOOGLE_PLAY_POLICY.md`

If asked "what's next," check these files and memory first. Do not rely on loose recall.
