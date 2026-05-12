# PulsePage Operations Notes

## Local commands
Run app:
```bash
npm start
```

Run tests:
```bash
npm test
```

Show status report:
```bash
npm run status
```

Show pending alerts:
```bash
npm run alerts
```

Check app health:
```bash
curl http://127.0.0.1:4177/healthz
curl http://127.0.0.1:4177/readyz
```

## What Randy needs to know
PulsePage is the app we are building. It watches websites/server ports and tells us when they go down.

Randy does not need to code. Tom handles code, tests, deployment steps, and Google Play technical details.

## Admin token

Set `PULSEPAGE_ADMIN_TOKEN` in production. When set, mutating API actions like adding monitors, deleting monitors, manual checks, and marking alerts delivered require:

```http
Authorization: Bearer <token>
```

This keeps the private backend from being open to random users while we are still in MVP mode.
