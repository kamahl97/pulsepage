# PulsePage Technical Plan

## Stack choice
Start with Node.js backend + mobile-style web UI.

Reason: this machine has Node installed but not Java/Android Studio. We can build the core business logic now, then later add Android tooling or wrap with Capacitor/React Native.

## Components
- `api/`: local prototype backend and monitoring engine.
- `app/`: mobile-style frontend prototype.
- Later: Android wrapper/native app.

## Backend MVP
Endpoints:
- `GET /api/monitors`
- `POST /api/monitors`
- `DELETE /api/monitors/:id`
- `POST /api/check/:id`
- `GET /api/summary`

Storage:
- JSON file for prototype.
- Later SQLite/Postgres.

Monitoring:
- HTTP GET request.
- Measure response time.
- Detect status code.
- Check TLS certificate expiry for HTTPS.

## Android path later
Option A: Capacitor wrapper around the web UI.
Option B: Native Kotlin/Jetpack Compose.
Recommendation: start with web/PWA + backend, then wrap once product is clearer.
