# Rest timer alarm and notifications checkpoint

## Scope and requirements

- Task: 08 release hardening extension.
- Branch: `feat/rest-timer-notifications-v110`.
- Base: `f08b543dce449b7fe0c32586c000cb10fe37c227`.
- Application version: `1.1.0`.
- Requirements: `PWA-090`, `UI-090`, `AT-D02`, `AT-E04`, `AT-E05`, `AT-K01`.

## Current and target behavior

Previously, rest expiry was monitored only by `ActiveWorkoutPage`. Navigating to another route unmounted the timer signal, so no beep or state reconciliation occurred there.

The timer is now monitored once at application-shell level. Its persisted `endsAt` remains the source of truth. An expired timer is claimed transactionally exactly once, marked complete, followed by best-effort alarm/vibration and a local service-worker notification when permission is granted. The active workout refreshes after the global completion event.

The workout screen presents an explicit notification permission action and an accurate denied state. Copy states that notification and alarm work while the app remains alive in the background, but does not promise delivery after Android terminates Chrome.

## Changed files

- `src/pwa/restTimerNotifications.tsx`: timer repository adapter, global monitor, permission request, alarm and service-worker notification.
- `src/pwa/restTimerNotifications.test.ts`: atomic expiry and notification delivery tests.
- `src/App.tsx`: global monitor mount.
- `src/pages/workout-active/ActiveWorkoutPage.tsx`: permission UI, audio preparation and timer-completion refresh.
- `tests/release.spec.ts`: Pixel 9a cross-route expiry regression.
- `package.json`, `package-lock.json`: semantic minor version bump to 1.1.0.

## Data, cache, network and provenance

- Database schema: unchanged at version 8.
- Export, seed and generator versions: unchanged.
- Service-worker cache version: unchanged; no cache-shape or asset change.
- Runtime network: unchanged; notifications use the existing local service worker and no push server.
- New dependencies or donor code: none.
- Existing active timers remain compatible; no migration is required.

## Verification evidence

| Gate | Result |
|---|---|
| TypeScript | Pass |
| ESLint | Pass with zero warnings |
| Unit/component/domain/migration suite | 30 files, 92 tests pass |
| Timer notification unit coverage | 3 tests pass |
| Pixel 9a / Chromium 412 release suite | 9 tests pass |
| Cross-route timer expiry | Pass; Home receives expiry and active workout resumes at Set 2 |
| Notification permission denied UI | Visually verified on v1.1.0 local production build |
| Production Vite/PWA build | Pass |
| GitHub Pages subpath smoke | Pass |
| Architecture, network, dependency, licence, asset, language, accessibility and performance audits | Pass |

## Known platform limitation

This is a 100% local PWA implementation. Android may throttle or freeze Chrome in the background, and no normal PWA can guarantee an exact local alarm after the operating system terminates the process. Reopening the app still reconciles the persisted timestamp correctly. Guaranteed process-kill delivery would require a native Android wrapper/local-notification scheduler or a remote push service, both outside the current local-only web scope.

Physical Pixel 9a verification of Android notification sound, vibration, lock-screen presentation and battery-optimization behavior remains a manual post-deploy check.

## Rollback and recovery

Rollback is code-only: revert the feature commit and redeploy the prior build. There is no schema or data rollback. Timer rows written as `completed` are already supported by the existing `RestTimerStatus` model, and active workout/set data is not altered by rollback.
