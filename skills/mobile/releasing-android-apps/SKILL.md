---
name: releasing-android-apps
description: "Guides an Android app from repository to Google Play closed test and production access: Play Console account verification, upload keystore outside the repository, R8 release bundle validation, privacy policy page, store listing assets and copy checks, Play Console declarations (data safety, foreground service, IARC content rating, target audience, trader status, AI assets), internal testing, 12-tester 14-day closed test, and emulator plus real-device checks. Use when preparing an Android app for Google Play, signing an .aab release bundle, filling Play Console forms, checking store listing limits, or verifying a release build on an emulator or phone. Not for writing Android features, Gradle upgrades, or Play Billing integration; before making a private repository public for a privacy policy page, the `security-practices` skill helps if available."
---

# Releasing Android apps to Google Play

Take an Android app from a working repository to a Google Play closed test and production access in order, separating what the agent automates from what the person must run or explicitly approve.

## Non-negotiable rules

- **Two roles on every step:** the **Agent** edits build config, validates release builds with throwaway keys, captures emulator assets, drafts copy, and builds evidence sheets; the **Person** verifies identity and device, creates the real upload key, holds all passwords, approves every legal or irreversible Play Console choice, and submits releases.
- **Never touch real signing secrets:** never generate, read, or ask the person to paste real keystore passwords in chat, and never commit a `.jks`/`.keystore` or signing `.properties` file to the repository — the upload key controls all future app updates.
- **Never run password prompts in non-interactive agent shells:** commands that prompt on a TTY (`keytool`, `ssh-keygen`, `passwd`) fail or abort with empty input under non-interactive `!` prefixes; have the person run them in a normal interactive terminal.
- **Explicit human approval for irreversible or legal actions:** never submit or confirm trader status, package name (`applicationId`), free vs. paid pricing, IARC terms and rating contact email, repository visibility changes, or track publication without the person's explicit go-ahead.
- **Live Play Console wins:** Play rules and form wording evolve; whenever a live Play Console prompt differs from a checklist, follow the current console text.

## Release path in order

Follow the steps sequentially. Start the closed test as soon as the first signed `.aab` is verified internally — bug-fix updates can be uploaded during the 14-day window.

| # | Step | Owner | Gate / Irreversible | Load when reached |
|---|---|---|---|---|
| 1 | Account and verification | Person | Legal: trader status | [play-console.md](references/play-console.md) |
| 2 | Upload signing outside the repo | Person (key) + Agent (Gradle) | Never commit key or passwords | [signing-and-build.md](references/signing-and-build.md) |
| 3 | Reduced release build on emulator | Agent (throwaway key) | Validate R8 + API level | [signing-and-build.md](references/signing-and-build.md) |
| 4 | Privacy policy page | Agent (draft) + Person (publish) | Repo visibility if private | [store-material.md](references/store-material.md) |
| 5 | Store listing material | Agent (draft/capture) + Person (approve) | Synthetic data only; run checker | [store-material.md](references/store-material.md) |
| 6 | App creation and Play Console forms | Person (decide/submit) + Agent (evidence) | Permanent package name, free/paid, IARC terms | [play-console.md](references/play-console.md) |
| 7 | Internal test | Person | Uninstall debug build first | [play-console.md](references/play-console.md) |
| 8 | Closed test (12 testers x 14 days) | Person + testers | Continuous 14-day count | [play-console.md](references/play-console.md) |
| 9 | Production access and publishing | Person | Publishing gate | [play-console.md](references/play-console.md) |

### 1. Account and verification (Person)

1. Complete Play Console onboarding tasks: government ID verification (matching the payments profile), real Android device verification (Android 10 or newer, unrooted, using the Play Console mobile app), and contact phone verification last.
2. Choose the public developer display name.
3. **Legal gate — Trader status:** declare trader vs. non-trader before creating the app. As a non-trader, EU/UK users see only email and country; as a trader, name, address, and phone are shown. Misdeclaring non-trader status can lead to app removal. Read [references/play-console.md](references/play-console.md) for details.

### 2. Upload signing outside the repository (Person + Agent)

1. Play App Signing is mandatory for new apps: Google manages the final app signing key while the developer keeps an upload key.
2. **Agent:** configure Gradle to read signing properties from outside the repository (for example `~/.android-keys/<app>-upload.properties`, overridable by a Gradle property or environment variable). Fail release bundling with an actionable error when the file is missing, and keep debug builds unaffected.
3. **Person (in a normal interactive terminal):** generate the RSA 4096 upload keystore with `keytool`, restrict permissions (`chmod 700` on the folder, `chmod 600` on the properties file), and save both the keystore copy and passwords in a password manager.
4. Read [references/signing-and-build.md](references/signing-and-build.md) before editing `build.gradle.kts` or instructing the person on `keytool`.

### 3. Reduced release build validated on an emulator (Agent)

1. Verify `targetSdk` meets Google Play's current requirement for new apps (Android 16 / API 36 since August 31, 2026).
2. Enable R8 (`isMinifyEnabled = true`, `isShrinkResources = true`), set `versionCode` and `versionName`, and point Gradle at a **temporary throwaway keystore** in a temp directory — never the real upload key.
3. Build the release bundle and APK, install the release APK on an emulator, and walk every core flow while watching `logcat` for `FATAL EXCEPTION`, missing classes, or reflection breaks.
4. Delete the temporary keystore after validation. Note that missing native debug symbols trigger a non-blocking Play warning (addressable in a later upload). Read [references/signing-and-build.md](references/signing-and-build.md) when setting up R8 and throwaway-key verification.

### 4. Privacy policy page (Agent drafts, Person approves and publishes)

1. **Agent:** draft a static HTML privacy policy (for example under `docs/privacy/index.html` for GitHub Pages) covering local files, runtime permissions (microphone, storage, notifications), every outbound network call, background services, children, updates, and a contact email. Link the final URL from the app's About or Settings screen.
2. **Agent:** write a data-safety evidence sheet mapping each Play Console question to the exact source files and dependencies that prove the answer.
3. **Visibility gate (Person):** GitHub Pages on the free plan requires a public repository, and a Pages site is always public even on a private repository. Before flipping a private repository to public, audit the full Git history and CI logs (the `security-practices` skill helps if available) and obtain the person's explicit approval. Read [references/store-material.md](references/store-material.md) for the privacy page checklist.

### 5. Store listing material (Agent drafts and captures, Person approves)

1. **Agent:** draft the listing copy in a markdown file with `<!-- name -->`, `<!-- short -->`, and `<!-- full -->` blocks (Play limits: 30 / 80 / 4000 characters). Avoid phrasing that reads like downloading copyrighted media from third-party services, and mention third-party brands only where strictly needed.
2. **Agent:** validate copy limits and forbidden terms before presenting the draft:
   ```sh
   python3 <skill-dir>/scripts/check-listing.py <path-to-listing.md>
   ```
3. **Agent:** prepare the 512 x 512 icon, 1024 x 500 feature graphic, 2 to 8 phone screenshots (320-3840 px per side), and any foreground-service demo video (`adb shell screenrecord`) on the emulator using synthetic sample data only — zero personal data and zero third-party logos.
4. **Person:** review and approve every text and image, and note which graphic assets were created or edited with AI tools. Read [references/store-material.md](references/store-material.md) when preparing copy or visual assets.

### 6. App creation and Play Console forms (Person decides and submits, Agent prepares evidence)

1. **Person — Irreversible gates at app creation:** creating the app locks the **package name (`applicationId`)** permanently and locks **Free** pricing permanently (a free app cannot become paid later).
2. **Person (using the Agent's evidence sheet):** complete all App content declarations: privacy policy URL, Data safety (data processed and stored solely on the device is not "collected"), foreground service types (with an Unlisted YouTube demo video), target audience (including children adds extra requirements), ads, app access, government/financial/health declarations, and the store listing's AI-generated assets declaration.
3. **Person — Legal gate (IARC):** the content-rating questionnaire accepts IARC terms of use and asks for a contact email shared with rating authorities; the person must review and submit it.
4. If a browser agent assists with form entry, remember that file pickers only accept files inside the session's allowed working directories, and the person must review and submit every legal or irreversible screen. Read [references/play-console.md](references/play-console.md) when filling Play Console forms.

### 7. Internal test (Person)

1. **Person** builds the real-signed `.aab` locally with `./gradlew bundleRelease`, uploads it to **Testing -> Internal testing**, adds their own Google account as a tester, and checks Google's automatic Pre-launch report.
2. **Uninstall any debug build** on the test phone before installing from Play: debug and Play-signed builds have different signatures, and uninstalling wipes local debug data.
3. Expect the app to appear as `<package> (unreviewed)` until Play reviews it, and allow up to an hour for propagation.

### 8. Closed test: 12 testers for 14 days (Person and testers)

1. Personal developer accounts created after November 13, 2023 require **at least 12 testers continuously opted in for 14 consecutive days** before production access unlocks.
2. Invite 1-2 extra testers as a buffer against dropouts, share the opt-in link, and ask testers to use core flows periodically (Google evaluates engagement, not just opt-in).
3. Avoid paid "12 testers" services: Google asks how testers were recruited and reviews real usage.
4. Upload updated `.aab` builds with bumped `versionCode` during the 14 days as bugs surface.

### 9. Production access and publishing (Person — Publishing gate)

1. After 14 continuous days, click **Apply for production access** and answer truthfully about tester recruitment, feedback received, and changes made (review usually takes up to 7 days).
2. Once approved, create a **Production** release with the latest verified `.aab`, select target countries, and submit for review (typically 1-3 days).

## Emulator and real-device testing

1. Run automated UI walks, dark/light theme checks, and screenshot captures on the **emulator first**. Use the bundled helper to inspect visible nodes, tap by label, and capture PNGs:
   ```sh
   <skill-dir>/scripts/emulator-ui.sh dump
   <skill-dir>/scripts/emulator-ui.sh tap "<visible label>"
   <skill-dir>/scripts/emulator-ui.sh shot <output.png>
   ```
2. Run a final **manual pass on a real phone** while watching `logcat` for crashes, ANRs, and background kills (`FATAL EXCEPTION`, `ANR in <package>`, `Killing .*<package>`). Several OEM Android skins (such as HyperOS) ignore `adb shell input` taps unless a vendor-account-gated toggle is enabled, and screen-mirroring daemons can also block `adb input` while `am start` intents still work.
3. **Android 16 (API 36) media-card gotcha:** with Media3 `MediaSessionService`, swiping away a paused media notification on API 36 only hides the card without delivering `stop` to the service. Expose an explicit `CommandButton` (for example "Close") backed by a `SessionCommand` that stops playback and releases the session.
4. Read [references/device-testing.md](references/device-testing.md) when running emulator scripts, debugging OEM phone input issues, recording foreground-service videos, or handling Android 16 media notifications.

## Final reminders

- Never ask for or store real keystore passwords in chat or Git; always validate R8 with a throwaway key first.
- Require the person's explicit approval before trader status, package name lock-in, free/paid choice, IARC terms, repo visibility changes, or publishing any track.
- Run `<skill-dir>/scripts/check-listing.py` on the store listing copy before finalizing.
