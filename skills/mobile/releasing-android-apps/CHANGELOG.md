# releasing-android-apps changelog

## [1.0.0] — 2026-11-20

- First standalone version covering the end-to-end path from an Android repository to Google Play closed testing and production access: account verification, external upload signing, R8 release validation with a throwaway key, privacy policy hosting, store listing material, Play Console declarations, internal and closed testing, and emulator plus real-device checks.
- Includes `references/signing-and-build.md`, `references/store-material.md`, `references/play-console.md`, and `references/device-testing.md`.
- Includes `scripts/check-listing.py` for store listing length limits and forbidden terms, and `scripts/emulator-ui.sh` for emulator UI inspection, tapping, and screenshots.
