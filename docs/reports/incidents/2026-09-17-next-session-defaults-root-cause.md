# Incident 2026-09-17 — unclear next-session defaults

## Summary

- Reported at: 2026-09-17
- Investigation mode: FIX, authorized by standalone `Go`
- Current Git SHA before correction: `1287b79cad2fdf909af14d285e11ef8fce7ea27b`
- Affected environment: web and Android UI, local database
- Severity: medium usability issue with one incorrect recommendation edge case
- Status: corrected and covered by automated tests

## User-visible symptom

The post-workout “Suggestions” / “View proposals” flow did not explain the difference between workout history, the 1–5 exercise preference rating, and a progression proposal. Actions such as “Use this default”, “Acknowledge” and “Dismiss” did not state the exact result.

When a saved exercise had no non-zero default load yet, the calculation also used `0 kg` as its baseline even if the completed working sets recorded a real load. A successful `100 kg` workout could consequently offer `2.5 kg` instead of `102.5 kg`.

## Evidence and classification

- First failing subsystem: progression calculation and UI presentation.
- Affected routes: `/workout/summary/:sessionId`, `/progress`, `/progress/proposals`.
- Schema/export/cache impact: none.
- Synthetic fixture only; no personal workout data was read or committed.
- `calculateProgression` previously added the increment to `currentLoadKg` unconditionally.
- `DexieWorkoutRepository.finish` passed every performed set for an exercise, including non-working set kinds.
- The UI used “suggestion”, “proposal”, “progression” and “feedback” for overlapping concepts and displayed raw persistence statuses.

## Root cause

The feature exposed its internal proposal model instead of the user decision: optionally changing one saved program's starting load for a future workout. Separately, the progression domain assumed that every prescription already had a meaningful non-zero default load and did not fall back to the load actually completed.

## Minimum correction

1. Rename the flow to “Next-session defaults” and explain history, exercise ratings and program defaults separately.
2. Show the exact current-to-proposed load, program name, completed working sets, target range and consequence of each action.
3. Scope the summary link to proposals created by that workout.
4. Keep past decisions collapsed and replace ambiguous actions with “Apply … next time”, “Keep …” and “Decide later”.
5. If the saved default is zero, use the last completed working-set load as the conservative calculation baseline.
6. Exclude warm-up, drop and other non-working sets from progression evaluation.

No proposal is automatically applied. Accepting or editing still updates only the saved prescription in the existing Dexie transaction; the completed workout and history remain immutable.

## Tests and recovery

- `src/generator/progression.test.ts` reproduces the zero-default-load case.
- `src/programs/ProgramRepository.test.ts` verifies that a `100 kg` completed workout proposes `102.5 kg` while leaving the stored default unchanged before confirmation.
- `src/pages/progression/ProgressionProposalsPage.test.tsx` verifies the explanations, exact before/after value, and explicit confirmation boundary.
- Existing proposals remain readable. No migration or user action is required.
- Rollback consists only of reverting this correction; no data conversion is involved.

## Risk assessment

- Data-loss risk: none identified.
- Migration risk: none; database schema is unchanged.
- Safety/privacy impact: recommendations are more conservative and no personal values are logged.
- Licence/provenance impact: none; no external code or media added.
- Requirement impact: preserves GEN-013–GEN-017 and the explicit-confirmation requirement.
