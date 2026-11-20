# releasing-android-apps 1.0.0

Version 1.0.0 guides an Android app from its repository to a Google Play closed test and production access, marking which steps an agent runs and which irreversible or legal steps require the person's explicit decision. It covers Play Console account verification, external upload signing, R8 release validation on an emulator with a throwaway key, privacy policy hosting, store listing assets and copy checks, Play Console declarations, internal testing, the 12-tester 14-day closed test, and real-device testing including OEM input quirks and Android 16 media notifications.

Includes four reference guides (`references/signing-and-build.md`, `references/store-material.md`, `references/play-console.md`, `references/device-testing.md`) and two helper scripts (`scripts/check-listing.py` and `scripts/emulator-ui.sh`). It needs no other skill; any skill it mentions is optional.

Acquire the whole `releasing-android-apps` directory (including `references/` and `scripts/`) from `Tacuchi/agent-skills` once the ref `skill/releasing-android-apps/v1.0.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
