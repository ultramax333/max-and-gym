# Android v1.3 checkpoint

## Outcome

Version 1.3.0 adds structured workout execution, richer progress history, configurable rest alarms, Android recovery diagnostics, and an opt-in GitHub Releases update flow.

## Delivered behavior

- Exercise prescriptions support straight, top/back-off, ramp, and drop schemes; supersets, trisets, and circuits are configured as exercise groups.
- Warm-up, working, and drop sets are persisted and identified during an active workout.
- Supersets and circuits execute round by round; transitions inside a group do not start a zero-second rest alarm.
- Progress includes exercise volume plus workout volume and duration trends.
- Android rest alarms support 5, 10, 20, or 30 second sounds, vibration control, classic/urgent/silent tones, and Stop/+30 s notification actions.
- Android diagnostics report notification and exact-alarm capability, persisted workout/timer recovery, and provide a safe five-second test when no real workout is active.
- About displays the installed version and offers a manual update check only inside Android.
- Update metadata and APK downloads are restricted to this repository's GitHub Release, require an increasing version code, and are never installed silently.

## Data and privacy impact

- No Dexie schema or index migration is required. New workout/program fields are optional and forward-compatible.
- Existing local workouts remain readable; backups naturally carry the new optional fields.
- No account, backend, analytics service, or cloud workout storage was added.
- The only new network origin is `api.github.com`, contacted after a manual update check. The APK opens from the validated GitHub Release URL only after confirmation.

## Verification

- TypeScript: passed.
- ESLint: passed with zero warnings.
- Unit/component/integration tests: 39 files, 137 tests passed.
- Dependency, architecture, Android, project, network, license, asset, exercise-asset, language, accessibility, and performance audits: passed.
- GitHub Pages production build and smoke test: passed.
- Android WebView build, smoke test, and Capacitor sync: passed.
- Pixel 9a viewport (412 x 915): no horizontal overflow; About, Diagnostics, Programs, and the create-program dialog render correctly; Diagnostics scrolls through its full 5,278 px content.
- Native Java/Gradle tests: delegated to GitHub Actions because the local environment has no Android JDK/SDK.

## Release requirements

Signed in-place updates require one permanently signed baseline APK and these repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `ANDROID_STORE_PASSWORD`

A trusted `master` build then verifies with `apksigner`, creates the `v1.3.0` tag at that master commit, and publishes the uniquely named APK to GitHub Releases. Feature branches and pull requests never receive signing secrets. Future releases must use the same application ID and signing key; otherwise Android requires uninstalling the previous app.

## Recovery and rollback

- Active workout and rest timer state remain local and are reconciled on app resume or cold start.
- A force-stop is an Android system boundary and may cancel alarms; diagnostics states this explicitly.
- If the updater is unavailable, the installed app continues working fully offline and an APK can still be installed manually.
- Rollback to an older Android version is not supported in place because Android version codes must increase; restore a prior backup after reinstalling only if a rollback is unavoidable.
