# Android native rest alarm checkpoint

## Scope

- Task: 90 controlled post-CP8 fix.
- Branch: `fix/android-native-runtime`.
- Base: `1c3c636217bc333f36e90c09e77c4e26d4e05e22`.
- Application version: `1.2.0`; Android version code: monotonic CI projection `120000000 + GITHUB_RUN_NUMBER`.
- Target device: Pixel 9a.
- Requirements: `AT-D02`, `AT-E04`, `AT-E05`, `PWA-090`, `FM-11`.

## Delivered

The existing React application is now also packaged as a Capacitor Android application. The web/PWA release remains supported and keeps its GitHub Pages base path; Android receives a separate relative-path build with no service worker.

The Android bridge schedules the committed rest deadline through `AlarmManager`. At expiry, a foreground service produces a ten-second audible/vibration alert and a high-priority notification with a Stop action. Every timer transition synchronizes only after the IndexedDB transaction succeeds, preserving the workout database as the source of truth. Reboot and package replacement restore still-valid alarms.

Android is the sole expiry authority inside the APK. Every scheduled projection carries the timer ID, committed deadline and a generation derived from both. Stale or early broadcasts are rejected by Android and again during the transactional IndexedDB acknowledgement, so extending or resuming a timer cannot be completed by an older alarm.

On launch or process recreation, the application recovers the active session and returns directly to the workout instead of the menu. Since browser and Capacitor WebView storage have different origins, existing PWA data is transferred explicitly through the established `.maxgym` backup/import format; the APK presents that choice on first launch.

## Safety and compatibility

- No database schema, export schema, seed or generator migration.
- No network service or account is introduced; the APK remains fully local after installation.
- Notification and exact-alarm permissions are requested explicitly and displayed in the workout UI.
- Denied exact-alarm access uses an inexact high-priority notification fallback and never blocks set logging; the UI does not claim that this fallback is an exact or long-running alarm.
- Android platform backup is disabled so private WebView/database state cannot leave the explicit `.maxgym` export path.
- The PWA still works, with a documented best-effort alert because browsers cannot guarantee background execution.
- Rollback is code/package-only; user data remains exportable with `.maxgym` backups.
- FileProvider sharing is restricted to the private `files/shared/` and `cache/shared/` directories.
- Debug APKs are test-only. Update-safe release APKs are built on `master` only with the complete external signing secret set and are verified with `apksigner`.

## Verification

| Gate | Result |
|---|---|
| `npm run quality` | Pass |
| Unit/component/domain tests | 32 files / 109 tests pass |
| Migration tests | 7 pass |
| Web production build / Pages smoke | Pass |
| Android web build / no-service-worker smoke | Pass |
| Capacitor Android sync | Pass |
| Browser active-session route recovery | Pass |
| Android debug APK compile and native unit task | Pass, workflow run `31222735215` |
| Pixel 9a app switch, screen lock, battery saver and process recreation | Pending physical device |

## Release decision

The post-scan correction compiled successfully at commit `d7cfba2`. CI published `max-and-gym-v1.2.0-120000004-debug-apk` with SHA-256 `71a97e74052908816b0c7152fbb80508a5ef0d3bbf9ac1414fd0780c9a69dfbb`. The debug artifact is suitable for Pixel 9a acceptance only; production updates additionally require the stable signing secrets documented in `docs/spec/RELEASE_PROCESS.md`. The checkpoint must not be called physically accepted until the Pixel 9a matrix confirms sound, vibration, notification, Stop action, timer rescheduling and workout recovery.
