# Play Console verification, forms, and test tracks

Load this reference when completing Play Console account verification, preparing form answers, creating the app, or running internal testing, closed testing, and production access.

## 1. Account verification (Person)

For a new personal developer account, complete onboarding tasks in this order:

1. **Identity verification:** Google pulls legal name and address from the payments profile and requests a government-issued photo ID.
2. **Real Android device verification:** install the *Google Play Console* app on an unrooted Android device running Android 10 or newer and sign in with the developer account.
3. **Contact phone verification:** completed after the identity and device checks.
4. **Developer display name:** shown publicly on every app listing under the account.

## 2. Irreversible and legal decisions (Person approval required)

Never submit, toggle, or confirm any row below without the person's explicit decision:

| Decision | Where in Play Console | Why it requires explicit human approval |
|---|---|---|
| **Trader status** | Account setup (before creating the app) | Legal disclosure under EU/UK rules. Non-traders show only email and country in EU/UK; traders show full name, physical address, and phone. Falsely claiming non-trader status can cause app removal. |
| **Package name (`applicationId`)** | Create app | Permanently bound to the Play Console app entry at creation time; cannot be changed later. |
| **Free vs. Paid** | Create app / Pricing | An app created as Free can never be converted to Paid later. |
| **IARC content rating** | App content -> Content rating | Submitting the questionnaire accepts IARC terms of use and shares a developer contact email with rating authorities. |
| **Repository visibility** | GitHub repo (for privacy policy Pages) | Exposes full Git history and CI logs permanently to the public internet. |
| **Publishing / promoting a track** | Publishing overview / Track releases | Triggers Play review or pushes binaries to testers or public users. |

## 3. App content declarations and evidence sheet

Before the person opens Play Console, the **Agent** builds a local evidence sheet (for example `store/forms.md`) mapping every declaration to the exact files in the repository so answers match the shipped binary.

### Data safety

- Check `AndroidManifest.xml`, the merged release manifest, and `app/build.gradle.kts` dependencies for analytics, crash reporters, ad SDKs, or network permissions inherited from libraries (for example `ACCESS_NETWORK_STATE` from Media3).
- Under Google Play's Data safety definitions, data processed and stored strictly on the device (`filesDir`, Room, `SharedPreferences`) is **not** counted as "collected".
- If the app only makes user-initiated fetches of public metadata (such as YouTube oEmbed for a pasted public URL) without user identifiers or telemetry, document both the Data safety rationale and the fact that the remote server still receives the URL and device IP (and disclose that in the privacy policy).
- If any data is collected or transmitted, confirm HTTPS encryption in transit and document how users can request deletion.

### Foreground service permissions

For every `foregroundServiceType` declared in the merged manifest (such as `mediaPlayback`):

1. Name the exact user-facing feature that requires background execution.
2. Explain how the user explicitly starts, controls, and stops the service (including notification actions and automatic pauses such as audio focus loss).
3. Explain the concrete user impact if Android terminates the process when the screen turns off or the user switches apps.
4. Provide a short demo video (uploaded to YouTube as **Unlisted**) showing the feature running with the notification visible while backgrounded.

### Other App content declarations

Complete every remaining item in **App content** before releasing:
- **Privacy policy:** paste the verified HTTPS URL from step 4.
- **Ads:** declare honestly whether the app contains ads or ad SDKs.
- **App access:** if any feature requires login or special credentials, provide test instructions; otherwise declare all functionality available without restricted access.
- **Target audience and content:** selecting 13+ or 18+ avoids children-specific policy requirements; including children under 13 adds Families Policy obligations.
- **Advertising ID, government, financial, and health apps:** declare accurately based on actual features and dependencies.
- **AI-generated assets (Store listing):** mark any icon, feature graphic, or listing image generated or edited with AI tools.

### Browser automation caveat

If a browser-automation agent assists the person in Play Console:
- Browser file upload controls only accept files located inside the agent session's allowed working directories.
- Stop before clicking final submit on any irreversible or legal screen so the person reviews and clicks submit themselves.

## 4. Internal test (Person)

1. Go to **Testing -> Internal testing**, create a release, and upload the real-signed `app-release.aab`.
2. Create an email list of internal testers (starting with the developer's own Google account) and copy the opt-in URL.
3. On the real Android phone, **uninstall any debug build first** — debug and Play-signed builds have different signing certificates, so installation fails otherwise (note that uninstalling deletes local debug data).
4. Open the opt-in URL on the phone and install from Google Play.
   - Expect the listing title to display as `<package> (unreviewed)` until Play reviews the app.
   - Allow up to an hour for the internal release to become downloadable.
5. Check the **Pre-launch report** that Google runs automatically on uploaded bundles for crashes, layout issues, and accessibility warnings.

## 5. Closed test: 12 testers for 14 days (Person)

Mandatory for personal accounts created after November 13, 2023 before production access is granted:

1. Create a track under **Testing -> Closed testing**, attach an email list of testers, upload the verified `.aab`, and submit the track for review via **Publishing overview**.
2. Recruit **at least 12 testers** (aim for 13-14 so one dropout does not reset the clock).
3. Every tester must opt in and stay opted in for **14 consecutive days**.
4. Ask testers to genuinely open and exercise the app over those two weeks and report issues. Google inspects real engagement and rejects applications where testers only opted in without using the app.
5. Avoid paid "12 testers" mills: even where not banned verbatim, Google checks usage patterns and asks how testers were recruited during the production-access review.
6. Upload updated `.aab` builds (with higher `versionCode`) during the 14-day period as you fix tester feedback; updating does not reset the 14-day clock.

## 6. Production access and release (Person)

1. Once 14 consecutive days with >=12 opted-in testers complete, **Apply for production access** unlocks on the dashboard.
2. Answer Google's questions factually: how testers were recruited, how they engaged, what feedback surfaced, and what changed in the app before production. Review typically takes up to 7 days (occasionally longer).
3. After approval, open **Production**, create a release with the latest `.aab`, select target countries/regions, and submit for review (typically 1-3 days).
