# PulsePage Architecture

## MVP architecture

A small backend service with:

- REST API for monitors and checks
- Background worker for scheduled checks
- SQLite or Postgres database
- Simple web dashboard/status page
- Notification adapter system

## Initial technical recommendation

Start simple:

- Backend: Node.js + TypeScript
- API: Fastify or Express
- Database: SQLite for local MVP, Postgres later
- Worker: Node cron loop / queue later
- Android: Kotlin + Jetpack Compose after backend MVP

## Core data models

### Monitor

- id
- name
- url
- interval_seconds
- enabled
- created_at
- updated_at

### CheckResult

- id
- monitor_id
- checked_at
- status: up/down/degraded
- http_status
- response_time_ms
- error_message

### AlertChannel

- id
- user_id
- type: email/discord/sms/webhook
- config
- enabled

## First monitoring rule

A URL is `up` if:

- Request completes before timeout
- HTTP status is 200-399

A URL is `down` if:

- Timeout
- DNS failure
- Connection error
- HTTP status 500+

A URL may be `degraded` later if:

- HTTP status 400-499
- Response time exceeds threshold

## Safety/security notes

- Do not store secrets in repo.
- Validate URLs to avoid SSRF/internal network abuse.
- Rate-limit monitor creation and checks.
- Log errors without leaking private tokens.
