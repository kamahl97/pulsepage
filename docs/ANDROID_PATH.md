# PulsePage Android Path

We are using Capacitor first because it lets us turn the working PulsePage web app into an Android app faster than rebuilding native screens from scratch.

## What exists now
- Capacitor config: `capacitor.config.json`
- Android project: `android/`
- App id: `com.pulsepage.monitor`
- App name: `PulsePage`
- Web assets copied from `app/`

## Important limitation
The Android app UI can be wrapped now, but it needs a deployed HTTPS backend before it is useful to real users. Local `/api/...` works in the browser prototype, but a phone app needs something like:

```js
window.PULSEPAGE_API_BASE_URL = 'https://api.pulsepage.app';
```

We added frontend config support for this in `app/config.js`.

## Commands
Install deps:
```bash
npm install
```

Sync web assets into Android:
```bash
npm run mobile:sync
```

Open Android project:
```bash
npm run mobile:open
```

Check Capacitor setup:
```bash
npm run mobile:doctor
```

## Missing on this machine
This OpenClaw host currently does not have Java/JDK, Gradle, or Android SDK command-line tools installed. That means we can scaffold and sync Android, but cannot compile a Play Store APK/AAB here yet.

## Next Android milestones
1. Deploy backend over HTTPS.
2. Set production API URL for Android.
3. Install Android build tools or use a CI builder.
4. Generate app icon/splash.
5. Build debug APK.
6. Build release AAB for Google Play closed testing.
