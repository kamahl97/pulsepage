# Google Play Console Resume Checklist

Use this when resuming PulsePage submission.

## Known status

- Package/app exists locally as a Capacitor Android project.
- Signed release AAB was previously built and hosted.
- Prior upload hit a versionCode issue, then build was updated to versionCode 2 / versionName 1.0.1.
- Current known hosted AAB from memory: `https://getpulsepage.com/play-console/pulsepage-release-v2.aab`
- Privacy policy page: `https://getpulsepage.com/legal/privacy.html`
- Support page: `https://getpulsepage.com/support/`

## Play Console steps

1. Confirm Google Play Developer account verification is complete.
2. Create/open app: `PulsePage: Website Monitor`.
3. Category: Tools.
4. Content rating target: Everyone.
5. Upload release AAB to internal or closed testing.
6. Use hosted privacy policy URL.
7. Use support URL/email requested by Play Console.
8. Fill Data Safety form using `docs/DATA_SAFETY_DRAFT.md`.
9. Add app icon, screenshots, and feature graphic from `play-store-assets/`.
10. Add store listing text from `docs/PLAY_STORE_LISTING.md`.
11. Create tester group/list.
12. Submit closed/internal testing release.

## Things not to claim yet

- Do not claim enterprise-grade reliability.
- Do not claim guaranteed uptime.
- Do not claim SMS/push alerts unless enabled in the submitted build.
- Do not mention paid subscriptions unless billing is implemented.

## Human inputs likely needed

- Google account verification screens.
- Any required personal/business info.
- Tester email addresses for closed testing.
- Final approval before submitting to Google review.
