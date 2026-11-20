# Emulator automation and real-device testing

Load this reference when running automated UI walks on an Android emulator, testing on physical OEM phones, watching `logcat` for crashes, or debugging Android 16 media notifications.

## 1. Two-stage testing strategy

1. **Emulator first (Agent):** run automated UI walks, R8 release checks, light/dark mode checks, screenshot captures, and foreground-service screen recordings on an emulator where `adb` input and UI inspection are deterministic.
2. **Real phone last (Person + Agent logcat watcher):** exercise the app by hand on a physical phone while watching `logcat` for crashes, ANRs, OEM background kills, audio routing, and hardware permissions.

## 2. Emulator workflow with `scripts/emulator-ui.sh`

Ensure `adb` (via `PATH`, `ANDROID_HOME`, or `ANDROID_SDK_ROOT`) and the `android` CLI (`PATH` or `ANDROID_CLI`) are available. When multiple devices are attached, set `ADB_SERIAL=<device-id>`.

```sh
# List visible text/content-desc nodes, tap coordinates, and supported interactions
<skill-dir>/scripts/emulator-ui.sh dump

# Tap the first node whose text or content-desc contains the string (optional 0-based index)
<skill-dir>/scripts/emulator-ui.sh tap "Save"
<skill-dir>/scripts/emulator-ui.sh tap "More options" 1

# Capture a PNG screenshot
<skill-dir>/scripts/emulator-ui.sh shot /tmp/screen.png
```

Useful companion `adb` commands on the emulator:

```sh
# Toggle dark / light mode
adb shell cmd uimode night yes
adb shell cmd uimode night no

# Send a text/link share intent directly (works from shell)
adb shell am start -a android.intent.action.SEND -t text/plain \
  --es android.intent.extra.TEXT "https://example.invalid/watch?v=demo" \
  -n <package>/.MainActivity
```

Note on file shares: launching `ACTION_SEND` for a `MediaStore` file from `adb shell am start` fails because shell cannot grant URI read permission on MediaStore files. Test file sharing from the emulator's Files app (long-press -> Share -> your app).

Note on emulator audio input: recording from the host microphone requires `hw.audioInput=yes` in the AVD's `config.ini`. Wired/Bluetooth headphone routing cannot be emulated reliably; cover headphone-detection branching with unit tests and verify audio playback on a real device.

## 3. OEM real-device quirks (for example HyperOS)

Physical phones running heavily customized OEM Android skins exhibit `adb` limitations that do not appear on AOSP emulators:

- **What works reliably:** `adb install`, `./gradlew installDebug`, `adb logcat`, and launching activities or intents via `adb shell am start` (`ACTION_VIEW`, `ACTION_SEND`).
- **What fails or flakes:**
  - `adb shell input tap` is often silently ignored unless an extra vendor-account-gated toggle ("USB debugging (security settings)") is enabled in Developer Options.
  - Even with that toggle on, taps frequently drop after running `uiautomator dump` or while screen-mirroring tools are connected.
  - **Screen-mirroring interference:** Android Studio's *Running Devices* mirroring (`app_process` running `com.android.tools.screensharing`) and tools like Vysor intercept or block `adb shell input`. Closing the mirroring window restores swipes, though simple taps may still drop on some skins.

### Reliable real-phone verification protocol

Do not waste time trying to drive an OEM phone via `adb shell input`. Instead:

1. Install the signed release or Play Internal Test build on the phone.
2. Start a focused `logcat` watcher in a terminal before touching the device:
   ```sh
   adb logcat -c
   adb logcat | grep -E "FATAL EXCEPTION|ANR in <package>|Killing .*<package>"
   ```
3. Have the person manually exercise core journeys on the phone: cold start, runtime permission prompts, background playback/service with screen locked, headphone plug/unplug, share intents from other apps, and light/dark switching.
4. Confirm zero `FATAL EXCEPTION`, zero `ANR`, and no unexpected `Killing` lines from OEM battery managers.

## 4. Android 16 (API 36) Media3 media-card behavior

Verified on Android 16 (API 36) with Media3 1.11.1:

- **Symptom:** even when `COMMAND_STOP` is advertised and `handleStop` is implemented in a `MediaSessionService`, swiping away a **paused** media notification card on Android 16 only hides the card visually. Nothing reaches the service, and the session remains `PAUSED` in the background. (Only long-pressing the card and choosing *Hide* calls stop.)
- **Fix:** expose an explicit custom `CommandButton` (for example **Close**) bound to a `SessionCommand` on the `MediaSession`. When invoked, stop the player, call `stopForeground(STOP_FOREGROUND_REMOVE)` and `stopSelf()`, and release the session so background execution ends immediately on one tap.
- **Media3 `CompositionPlayer` tip:** if the app mixes tracks with `CompositionPlayer` inside a `MediaSessionService`, wrap `CompositionPlayer` in a `ForwardingSimpleBasePlayer` so the session exposes standard playback state, seeking, and custom commands cleanly.
