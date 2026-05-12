# PulsePage

Simple website and server uptime monitoring for side hustlers, freelancers, small businesses, and solo founders.

## Core promise

**Know your site is down before your customers do.**

PulsePage is an MVP/prototype for monitoring money pages, websites, APIs, and server ports. It is designed to become a simple Google Play app + lightweight backend/service.

## Current features

- HTTP/HTTPS website checks
- TCP port checks
- Response time tracking
- SSL certificate expiry info for HTTPS targets
- Check history
- Pending alert reporting
- Simple web UI
- Capacitor Android wrapper
- Deployment notes for a small VPS service

## Repo structure

```text
api/                 Node.js backend/API + monitor logic
app/                 Simple web app UI
android/             Capacitor Android project
assets/              Brand/source assets
deploy/              Nginx/systemd/env deployment drafts
docs/                Product, policy, deployment, and launch notes
marketing/           Positioning and landing-page copy ideas
play-store-assets/   Google Play listing assets and screenshots
research/            Research notes
scripts/             Release/helper scripts
```

## Local development

```bash
npm install
npm test
npm start
```

Default local service:

```text
http://127.0.0.1:4177
```

## Environment

Copy `.env.example` to `.env` for local/prod configuration.

Important production note: set `PULSEPAGE_ADMIN_TOKEN` before exposing mutating API routes.

## Data safety

Runtime monitor data under `api/data/*.json` / SQLite files is ignored by Git. Use `api/data/sample-pulsepage.json` as a safe example.

## Status

MVP prototype exists. Next steps are GitHub remote setup, cleanup pass, and Google Play/closed-test continuation.
