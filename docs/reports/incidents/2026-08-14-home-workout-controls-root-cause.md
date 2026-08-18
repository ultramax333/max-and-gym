# Incident 2026-08-14-home-workout-controls — root-cause report

## Summary

- Reported at: 2026-08-14
- Investigation mode: FIX, authorized by the project-owner standalone instruction `Go` after the root-cause report was complete.
- Current Git SHA: `43cdc83` on the unmerged `1.5.0` release branch; affected product code is inherited from `13a9674` / release `1.4.0`.
- Last known good checkpoint/SHA: none identified for these four behaviors.
- Affected environment: installed Android application on Pixel 9a; exact installed build not supplied.
- Visible error ID: none.
- Severity: high usability; no evidence of data loss.
- Status: root causes proven and corrected on the `1.5.0` release branch.

## User-visible symptoms

### Expected

- Weight and repetitions can both be saved as per-exercise defaults.
- Android Back returns to a safe parent screen and never exits the application unexpectedly.
- Home exposes Resume and Stop/Abandon controls for an active session.
- Starting the next program day from Home either starts it, resumes the existing session, or presents a clear conflict choice.

### Observed

- Active Workout exposes only `Use … kg as default`.
- The repetitions field can be changed in source, but its draft is reinitialized from `targetRepsMin` whenever the current-set object is refreshed; Android focus/visibility reconciliation can therefore overwrite an in-progress real-repetition edit.
- Android Back closes the activity when the WebView has no native navigation entry.
- Home reads the active training program but not the active workout session and therefore exposes no abandon action.
- Home starts a planned day without busy/error/conflict handling. An existing workout raises `WORKOUT_ACTIVE_SESSION_CONFLICT`; an empty next day redirects silently to Programs.

### Exact reproduction steps

1. Start a workout, return to Home, and tap the featured next-program card. The repository rejects a second session, while Home displays no feedback.
2. With that active workout, inspect Home. There is no Resume/Stop control tied to the active session.
3. In Active Workout, edit repetitions. Only the load-default action is available.
4. Open a route without a native WebView history entry and press Android Back. `MainActivity` disables its callback and dispatches the system back action, closing the activity.

## Evidence preserved

- Diagnostic export: not supplied and not required to prove these static UI/control-flow defects.
- Build/continuous-integration logs: PR #18 quality, browser and Android gates passed, demonstrating missing behavioral coverage rather than a failed build.
- Screenshots: not supplied for this incident.
- Synthetic fixture: existing repository tests cover saved default load and abandon persistence, but no Home or native-back regression test covers the reported behaviors.
- Personal backup confirmed: not applicable; investigation was read-only.

## Classification

- First failing subsystems: UI rendering/control flow and Android browser capability integration.
- Downstream symptoms: silent program-start failure and unexpected activity exit.
- Affected routes/features: Home, Active Workout, program-day start, Android Back.
- Affected schema/export/seed/generator/cache version: database `8`, export `2`, seed `reviewed-5` candidate / `reviewed-4` deployed, generator `deterministic-v5`, cache `5`; no schema cause.

## Proven facts

1. `ActiveWorkoutPage.tsx` calls only `saveDefaultLoad`; the repository interface, application service and Dexie repository have no repetition-default equivalent.
2. `HomeShellPage` subscribes only to `ProgramRepository.active()` and does not query `workoutSession` or call `abandon`.
3. `startNextProgramDay` awaits `startProgramDay` without a catch or visible state. `DexieWorkoutRepository.startProgramDay` throws `WORKOUT_ACTIVE_SESSION_CONFLICT` whenever an active or paused session exists.
4. `startNextProgramDay` redirects to `/programs` when the selected day has no exercises without explaining why.
5. `MainActivity.configureBackNavigation` calls `webView.goBack()` only when `canGoBack()` is true. Otherwise it disables the callback and invokes the dispatcher, which finishes the only activity.
6. Existing tests cover load defaults and repository abandon behavior but not repetition defaults, Home conflict controls, or root-history native Back.
7. `ActiveWorkoutPage` initializes `repsInput` from `currentSet.targetRepsMin` in an effect keyed by the complete `currentSet` object. The page also replaces the snapshot on focus/visibility recovery, so a refresh of the same set can reset a user-entered value such as 5 back to the target 8.
8. The repository does not constrain `actualReps` to the prescribed range; recording 5 against a target of 8 is valid and must remain possible.

## Supported inferences

1. The “sometimes” start failure corresponds to state-dependent conditions: an already active workout or an empty current program day.
2. Hash-route history is not guaranteed to produce a native WebView back entry after launch/recreation, so `WebView.canGoBack()` alone cannot implement application navigation reliably.

## Remaining hypotheses

1. Exact frequency may also depend on whether the app was relaunched directly into a nested hash route.
2. The installed build number is needed only for regression-range attribution, not for the minimum correction.

## Hypotheses excluded

1. No database migration, exercise seed, remote network, or service-worker dependency participates in these code paths.
2. The missing Stop control is not hidden by responsive CSS; it is absent from `HomeShellPage`.

## Regression range

- First bad commit: not established; the required controls were never implemented in the current Home/native shell.
- Comparison method: current product-code inspection plus existing test inventory.
- Relevant files: `ShellPages.tsx`, `ActiveWorkoutPage.tsx`, `WorkoutApplicationService.ts`, `WorkoutRepository.ts`, `DexieWorkoutRepository.ts`, `NativeLifecycleCoordinator.tsx`, and Android `MainActivity.java`.

## Root causes

The four symptoms come from three missing contracts: no persisted repetition-default API, no active-workout state machine on Home, and no Java-to-React fallback when native WebView history is empty. The program-start symptom is amplified by an unhandled, valid repository conflict and a silent empty-day redirect.

## Requirement and risk impact

- Requirement IDs: AT-E01, AT-E06, AT-E07, AT-K01; workout state-machine ACTIVE/PAUSED → ABANDONED navigation.
- Data-loss risk: low; abandon already preserves completed sets, but unexpected app exit harms confidence.
- Migration risk: none if repetition defaults use versioned `appMeta`, as load defaults do.
- Cache/update risk: normal release update only.
- Safety/privacy impact: none; no new personal data leaves the device.
- Licence/provenance impact: none.

## Regression-test plan

- Repository: saving default repetitions updates every remaining working set and applies to the next session, without changing completed sets.
- Active Workout UI: valid repetitions expose a repetition-default action and confirmation.
- Active Workout UI: minus/plus and direct entry can record an exact non-negative whole number outside the prescribed range, and same-set recovery never overwrites that draft.
- Home component: an active session shows Resume and Stop; stop requires confirmation and preserves completed sets.
- Home component: active-session conflict and empty-day conditions produce deterministic visible actions instead of an unhandled promise.
- Native navigation: a `maxgym:native-back` event maps nested hash routes to safe parents and keeps `/` open; Android source audit verifies the activity no longer delegates an empty-history Back to system exit.

## Minimum correction

1. Add a versioned repetition-default map in `appMeta`, repository/service methods, and a paired Active Workout action.
   Preserve the current repetition/load drafts across same-set focus recovery, initializing them only when the current set identity changes.
2. Make Home observe the active workout, show Resume and confirmed Stop/Abandon, and handle planned-day start errors and conflicts explicitly.
3. When native WebView history is empty, dispatch a JavaScript back event instead of finishing the activity; handle it with deterministic safe-parent routing and no action at Home.
4. Add the regression tests above and keep all operations transactional/idempotent.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Exit the app when route history is empty | Violates the explicit Android navigation requirement. |
| Clear the active workout automatically before starting a program | Destructive and bypasses confirmation. |
| Store repetition defaults only in component state | Would not survive reload or apply to future sessions. |
| Change the database schema | Unnecessary; versioned `appMeta` already safely stores load defaults. |

## Recovery and rollback

- Existing affected data: no repair required.
- Forward recovery: update the application; existing active workouts and completed sets remain intact.
- Rollback: revert the corrective commit; no schema or export downgrade is involved.
- User action required: none beyond installing the future signed update.

## Verification

| Command/test | Result | Evidence |
|---|---|---|
| Static route/repository inspection | Root causes proven | Files listed above |
| Existing full unit/component suite | Pass, but missing reported scenarios | 47 files / 186 tests on release candidate |
| Release quality and Android web smoke | Pass | `v1.5.0` bundle smoke |
| Corrective full unit/component suite | Pass | 49 files / 193 tests |
| Corrective type check and lint | Pass | zero errors and zero warnings |
| Corrective project/release audits | Pass | dependency, architecture, Android, project, network, licence, asset, exercise-media, language, accessibility and performance audits |
| Corrective production builds | Pass | GitHub Pages subpath smoke and Android web bundle smoke, version `1.5.0` |
| Local Gradle Java compilation | Not available | no JDK installed; pull-request Android workflow is the required verification surface |

## New diagnostic coverage

- Error code: reuse `WORKOUT_ACTIVE_SESSION_CONFLICT`; no new code required for expected user choice.
- Safe diagnostic context: route and error class only.
- Redaction test: existing diagnostic allow-list remains sufficient.

## Known failure-mode update

- Existing FM identifiers: FM-12, FM-13, FM-34.
- FM-36 added: native Back must not finish the sole activity when application history is empty.

## Final verdict

- Root cause proven and minimum coherent correction implemented.
- Existing workout data is preserved; no schema, export, seed or cache migration was introduced by this correction.
- Corrective tests and release gates pass, with Gradle/APK compilation intentionally deferred to GitHub Actions because the local environment has no JDK.
- Task 90 corrective gate is folded into the single unmerged `1.5.0` release candidate.
