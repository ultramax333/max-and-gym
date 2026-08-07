# Incident 2026-08-07-background-rest-alarm — root-cause report

## Summary

- Reported at: 2026-08-07 after production deployment of v1.1.0 build 9.
- Investigation mode: DIAGNOSE, followed by the user-authorized Task 90 `MODE=FIX` correction.
- Production Git SHA: `1c3c636217bc333f36e90c09e77c4e26d4e05e22`.
- Local feature commit: `0ac7c00f43518d04be818ca8bede62b37b272b24`.
- Last known good checkpoint/SHA: not applicable; reliable physical-background alarm delivery was never accepted.
- Affected environment: Pixel 9a, Android Chrome; installed-PWA versus browser-tab state remains to be confirmed.
- Visible error ID: none.
- Severity: medium; missed alert, no workout-data loss.
- Status: root cause proven; Android correction implemented and compiled on `fix/android-native-runtime`, pending physical Pixel 9a acceptance.

## User-visible symptom

### Expected

At the persisted rest deadline, the phone emits an alarm and displays a notification while Max & Gym is in the background.

### Observed

The timer does not sound after the app/page is backgrounded. On some returns, the PWA restarts on the menu instead of restoring the active workout route. The current alarm is also shorter than the requested alert duration.

### Exact reproduction steps

1. Open production v1.1.0 build 9 on the Pixel 9a.
2. Start or resume a workout and complete a set so a rest timer starts.
3. Put Chrome/PWA in the background by switching to another Android app or locking the screen.
4. Wait beyond the persisted `endsAt` deadline.
5. No alarm is heard. Whether a notification appears remains to be confirmed.
6. On some resumes, observe that the shell opens on the menu even though the workout data remains persisted.

## Evidence preserved

- User report: background timer does not sound on Pixel 9a.
- Build/continuous-integration logs: PR #9 quality and Chromium checks passed; master quality, Pages deployment and production smoke passed.
- Synthetic fixture: the existing Playwright test changes application route but never freezes the browser page.
- Personal backup confirmed: not applicable; investigation is read-only and no user data is changed.

## Classification

- First failing subsystem: browser capability / timer scheduling.
- Downstream symptoms: page alarm, vibration and notification delivery do not execute at the deadline; process recreation can lose the current UI route.
- Affected route/feature: global rest timer monitor and active-workout boot routing.
- Affected versions: app 1.1.0 build 9; schema 8; export 2; cache 3.

## Reproduction matrix

| Environment | Result | Evidence |
|---|---|---|
| Existing Pixel 9a profile | Fail | User physical-device report |
| Clean desktop profile, another SPA route | Pass | `rest timer expires while another app screen is open` |
| Installed PWA | Unknown | User confirmation needed |
| Android browser tab | Unknown | User confirmation needed |
| Online / offline | Expected identical | Scheduling is local and does not use network |
| Service worker bypassed | Expected identical failure | The service worker is contacted only after the page callback runs |
| v1.0.4 | No background implementation | Baseline before the feature |
| v1.1.0 | Fail when Android freezes the page | Physical-device report plus source/lifecycle evidence |

## Proven facts

1. `RestTimerNotifier` schedules expiry with `window.setTimeout` in `src/pwa/restTimerNotifications.tsx`.
2. `playRestAlarm()` and `showRestNotification()` run only after that page callback claims the expired timer.
3. The notification is shown immediately through an existing service worker; no operating-system alarm or scheduled notification is registered ahead of time.
4. Chrome documents that frozen pages suspend JavaScript timers and other freezable tasks until the page is resumed, which may never occur: <https://developer.chrome.com/docs/web-platform/page-lifecycle-api>.
5. Chrome's Notification Triggers experiment would have scheduled locally through Android, but its development ended and launch status remains “not started”: <https://developer.chrome.com/docs/web-platform/notification-triggers>.
6. Chrome documents Web Push as the background mechanism that can wake a service worker, but it requires a push service/server and is not an exact local alarm: <https://web.dev/articles/push-notifications-faq>.

## Supported inferences

1. Android freezes the page before the rest deadline, preventing `deliver()` from running.
2. Because `deliver()` never runs, neither Web Audio nor `showNotification()` is invoked at the deadline.
3. On foreground resume, the persisted timestamp can still be reconciled, so workout state is retained even though the alert was missed.
4. If Android discards and recreates the web process, a PWA can launch from its manifest `start_url`; the app has no boot rule that redirects an existing active workout back to `#/workout/active`.

## Remaining hypotheses

1. Notification permission or Android notification-channel sound settings may independently suppress system sound, but they cannot explain or repair the suspended page callback.
2. Installed-PWA and normal-tab freeze timing may differ, but neither provides a web-platform execution guarantee.

## Hypotheses excluded

1. Deployment/cache mismatch: production v1.1.0 build 9 and commit `1c3c636` were verified after deployment.
2. Timer database corruption: the timer uses persisted timestamps and foreground/cross-route expiry tests pass.
3. Network failure: the current implementation is local and makes no runtime notification request.

## Regression range

- First bad commit: `0ac7c00f43518d04be818ca8bede62b37b272b24` introduced the unsupported background-delivery claim and page-owned scheduling behavior.
- Comparison method: source inspection against `f08b543dce449b7fe0c32586c000cb10fe37c227` plus physical-device report.
- Relevant diff: global monitor schedules `window.setTimeout`; service-worker notification is invoked only after expiry.

## Root cause

The v1.1.0 design treats a page JavaScript timer as an Android background scheduler. A service worker can display a notification when awakened by an event, but registering one does not keep it alive and calling `showNotification()` after a page callback does not schedule future delivery. When Android freezes the background page, the callback does not run, so there is no alarm or notification event to deliver.

## Requirement and risk impact

- Requirement IDs: `AT-D02`, `AT-E04`, `AT-E05`, `PWA-090`.
- Data-loss risk: none.
- Migration risk: none for diagnosis; a native wrapper would require an explicit storage/data continuity plan.
- Cache/update risk: none for diagnosis.
- Safety/privacy impact: missed rest cue only; no data disclosure.
- Licence/provenance impact: none.
- Existing risk: `R-15` and `FM-11` already state that PWA background alerts cannot be guaranteed.

## Failing automated test

- Test path: not added in DIAGNOSE mode.
- Required test: freeze the page through Chromium lifecycle controls after starting a short synthetic timer and assert that v1.1.0 does not mark or notify it until resume.
- Physical acceptance: Pixel 9a matrix covering app switch, screen lock, battery saver and process termination.
- Why the existing test missed it: it navigates between routes while the document remains active; the global React component and its timeout continue running.

## Minimum correction

Two valid scopes exist:

1. Web-only correction: remove the background-delivery promise, retain timestamp recovery, and alert immediately on foreground resume. This is honest but does not satisfy a guaranteed background alarm.
2. Reliable local alarm: package the existing web UI in a minimal Android application and bridge rest deadlines to Android `AlarmManager`/local notifications, including cancellation, pause/resume and timer adjustments. Android documents alarms as operating outside the application's lifetime: <https://developer.android.com/develop/background-work/services/alarms>.

The native correction must also:

- restore `#/workout/active` whenever a persisted active workout exists after process recreation;
- preserve the exact current set and rest deadline from IndexedDB/native mirrored timer metadata;
- play an alarm pattern for a user-visible duration (proposed default: 10 seconds) with vibration and a Stop action;
- cancel or reschedule the native alarm on Skip, pause, resume, `+15`, `-15`, finish and abandon;
- provide permission-denied and exact-alarm-denied states without blocking workout logging.

The second option remains 100% local but changes the distribution surface from pure PWA to an Android wrapper and therefore needs an explicit architecture/data-continuity decision.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Move `setTimeout` into the service worker | Service workers are terminated when idle; their timers are not a scheduler |
| Notification Triggers API | Experiment ended; not launched for production use |
| Web Push | Requires server infrastructure, network, and is not exact under doze |
| Silent/near-silent background audio keepalive | Unreliable, battery-hostile, exposes media controls and may still be frozen |
| Wake Lock | Released/ineffective when the document becomes hidden and does not schedule Android alarms |

## Recovery and rollback

- Existing affected data: no repair required.
- Forward recovery: foreground resume reconciles the persisted timestamp.
- Rollback: code rollback does not improve background delivery; it only removes the misleading v1.1.0 feature.
- User action required now: keep the PWA visible for the current best-effort alarm, or use the Android system timer separately.

## Verification

| Command/test | Result | Evidence |
|---|---|---|
| Production deployment smoke | Pass | v1.1.0 build 9 / `1c3c636` |
| `doctor` read-only inspection | Pass | branch, package, PWA base and dependencies reported |
| Source scheduling trace | Fail for frozen state | page `window.setTimeout` gates all delivery |
| Cross-route Playwright test | Pass but insufficient | document never enters frozen lifecycle |

## New diagnostic coverage

- Proposed error code: `TIMER_BACKGROUND_DELIVERY_UNSUPPORTED` or capability state rather than a caught error.
- Safe diagnostic context: visibility state, installed-display boolean and notification permission only.
- Redaction test: no workout values or exercise identity.

## Known failure-mode update

- Existing identifiers: `FM-10`, `FM-11`, `R-15`.
- No new failure class is required; the implementation contradicted an already documented platform limitation.

## Resolution applied

- Capacitor Android application added without removing the GitHub Pages PWA.
- The persisted rest deadline is mirrored to Android `AlarmManager` only after successful workout-state commits.
- Alarm delivery uses a foreground media-playback service, a high-priority notification, vibration, a 10-second sound pattern and a Stop action.
- Pause, resume, adjust, skip, undo, finish and abandon reschedule or cancel the single native alarm projection.
- Reboot/package replacement restores a still-valid alarm; app relaunch recovers a persisted workout and routes to `#/workout/active`.
- Native permission state is visible and actionable. Exact-alarm denial falls back to an inexact high-priority notification without blocking workout logging; reliable ten-second background sound requires exact-alarm access.
- Existing PWA data can be transferred explicitly with the existing local `.maxgym` backup import; origins are not silently conflated.
- The web build retains honest best-effort foreground/background behavior and now emits the longer alert when execution remains available.

## Verification after correction

| Gate | Result |
|---|---|
| TypeScript / ESLint | Pass / zero warnings |
| Unit and component suite | 31 files / 97 tests pass |
| Database migrations | 7 tests pass |
| Architecture, dependency, project, network, licence, asset, language, accessibility and performance audits | Pass |
| GitHub Pages production build and subpath smoke | Pass |
| Capacitor Android web build and sync | Pass |
| Browser active-workout boot recovery | Pass on isolated production preview |
| Native Java compilation | Pass, GitHub Actions run `31221094614` |
| Pixel 9a background/lock-screen acceptance | Pending installation of the CI-produced APK |

## Final verdict

- Root cause proven and product correction implemented in `MODE=FIX`.
- The web limitation remains documented; the Android package is the reliable local-alarm surface.
- Automated source, web, state and integration gates pass locally.
- Final acceptance still requires a successful Android CI build and the CP8 physical Pixel 9a matrix.
