# Store listing material and privacy policy

Load this reference when drafting Google Play listing copy, capturing emulator screenshots or demo videos, declaring AI-generated assets, or writing the public privacy policy page.

## 1. Store listing copy and automated checks

Google Play enforces strict character limits on text fields:

| Field | Max length | Block marker for `check-listing.py` |
|---|---|---|
| App name | 30 characters | `<!-- name --> ... <!-- /name -->` |
| Short description | 80 characters | `<!-- short --> ... <!-- /short -->` |
| Full description | 4000 characters | `<!-- full --> ... <!-- /full -->` |

### Copy hygiene rules

- **Avoid download phrasing:** do not describe features in a way that reads like downloading copyrighted media from YouTube, TikTok, Instagram, or other platforms. Emphasize local files the user chooses or shares.
- **Third-party brands:** mention third-party platform names only where strictly necessary to describe an explicit link or intent behavior; never display third-party logos in screenshots or graphics.
- **Honest scope:** describe only features present in the release bundle being uploaded.

### Validating with `scripts/check-listing.py`

Keep the listing draft in markdown (for example `store/listing.md`) with comment markers:

```markdown
<!-- name -->
Sample Audio Studio
<!-- /name -->

<!-- short -->
Mix local tracks and voice notes directly on your phone.
<!-- /short -->

<!-- full -->
Combine your own background audio, cover image, and voice recordings on-device.
<!-- /full -->
```

Run the checker from the repository root:

```sh
python3 <skill-dir>/scripts/check-listing.py store/listing.md
```

Use `--forbidden "<pattern>"` (repeatable) or `--forbidden-file <path>` to add project-specific banned terms on top of the default download-related words. The script exits non-zero on any missing block, empty field, exceeded limit, or forbidden match.

## 2. Visual assets and screenshots

| Asset | Specification | Notes |
|---|---|---|
| App icon | 512 x 512 px, PNG | No transparency issues; matches launcher identity |
| Feature graphic | 1024 x 500 px, PNG or JPEG | Keep key art away from edges (safe margin) |
| Phone screenshots | 2 to 8 images, 320-3840 px per side | 16:9 or 9:16 aspect ratio |
| Foreground-service demo video | Short MP4 (typically 15-45 s) | Upload to YouTube as **Unlisted** for the Play Console declaration |

### Capture guidelines (Agent on emulator)

- Populate the emulator with **synthetic sample data only** (generated audio tones, neutral titles, placeholder art). Never include personal photos, real names, real email addresses, or third-party copyrighted media or logos.
- Capture clean PNGs via `<skill-dir>/scripts/emulator-ui.sh shot <file.png>`.
- Record the foreground-service demo video with:
  ```sh
  adb shell screenrecord --time-limit 30 /sdcard/fg-demo.mp4
  adb pull /sdcard/fg-demo.mp4 store/fg-demo.mp4
  adb shell rm /sdcard/fg-demo.mp4
  ```
  Show: (1) user taps the action that starts the service, (2) user leaves the app or locks the screen while the persistent notification and functionality remain active, and (3) user stops the service from the notification or app.
- **AI-generated assets declaration:** record which visual assets (for example an icon or feature graphic generated or edited with AI tools) must be marked in Play Console's AI-generated content declaration.

## 3. Privacy policy page

Play Console requires a publicly accessible HTTPS privacy policy URL for every app.

### Hosting with GitHub Pages

- Place a self-contained static HTML file at `docs/privacy/index.html` on `main`.
- **Visibility gate (Person):** GitHub Pages on the free plan requires a public repository, and any GitHub Pages site is public even when its repository is private. Before changing a private repository to public, audit the entire Git history (`git log --all -p`) and GitHub Actions logs for secrets, personal emails, or internal URLs (the `security-practices` skill helps if available), and get the person's explicit approval.
- Enable Pages from `/docs` on `main` and verify the URL returns HTTP 200 before pasting it into Play Console.
- Link the exact same URL inside the app's About or Settings screen so users can open it directly.

### Sections to cover accurately

1. **Effective date and one-paragraph summary** of what the app does with user data.
2. **What the app does not do:** accounts/login, ads, analytics/telemetry, crash reporting, remote servers, or data selling/sharing (state only what is verified in code and dependencies).
3. **Local files and storage:** which files are copied into app-private storage, whether temporary directories are cleared, and how uninstalling or Android Backup handles them.
4. **Runtime permissions:** when each permission (microphone, camera, photos, notifications) is requested and what it does.
5. **Network access:** every outbound connection, what data leaves the device (including IP address and any user-pasted URLs sent to third-party endpoints like oEmbed), and links to the relevant third-party privacy policies. Note external `ACTION_VIEW` intents separately.
6. **Foreground / background services:** what runs in the background, how the user controls it, and whether it transmits data.
7. **Children:** state clearly if the app is not directed to children.
8. **Policy updates and contact email:** how changes are posted and an active contact email address.
