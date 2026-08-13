# Active workout modern redesign

Date: 2026-08-12

Scope: active workout presentation and controls

Requirements: UI-010 through UI-020, UF-03, UF-04, UF-05, active-workout screen blueprint

## Outcome

The approved performance-minimalist prototype is now implemented in the real active-workout route. The existing workout application service, repository, IndexedDB schema, set idempotency, persisted timer timestamps, recovery flow, native Android alarm projection, and exercise-media resolver remain unchanged.

## Current behavior

- A compact sticky header shows the session name, elapsed duration, set progress, back action, and pause/resume action.
- A horizontal exercise rail shows current, pending, and completed exercises and permits safe mid-session switching.
- Both reviewed local exercise positions remain visible in a single hero area.
- Previous performance, a short movement cue, expandable technique steps, targets, and set position are grouped around the current exercise.
- Load and repetition inputs support direct replacement of zero and 48-pixel increment/decrement actions.
- RIR and default-load persistence remain available without dominating the primary flow.
- The workout plan and session controls remain accessible below the primary logging area.
- The fixed bottom action keeps `Complete set` available during rest, alongside timestamp-derived rest controls, so rest never blocks continued training.
- Exercise changes return the workout scroll container to the top and retain the explicit change status message.

## Changed files

- `src/pages/workout-active/ActiveWorkoutPage.tsx`
- `src/pages/workout-active/ActiveWorkoutUi.tsx`
- `src/pages/workout-active/ActiveWorkoutUi.test.tsx`

## Data and release impact

- Database schema: unchanged.
- Export format: unchanged.
- Cache strategy: unchanged.
- Runtime network origins: unchanged.
- Dependencies: unchanged.
- App version/build number: unchanged; this checkpoint is local and not deployed.

## Verification

- TypeScript: `tsc --noEmit` passed.
- Target ESLint: passed with zero warnings.
- Unit/component suite: 47 files and 185 tests passed.
- Production web build: passed; 13,294 modules transformed.
- GitHub Pages subpath smoke: passed.
- Focused active-workout end-to-end journeys: 4/4 passed at 412 × 915 and 4/4 passed at 360 × 800.
- Project, architecture, network, and accessibility audits: passed.
- Manual Pixel 9a evidence: two local images visible, no horizontal overflow, exercise switching works, set 2 appears after completion, rest timer and `Complete set` remain simultaneously available.

## Accessibility evidence

- Named back, pause/resume, exercise navigation, numeric decrement/increment, timer, and plan controls.
- Semantic current-exercise and set headings.
- Progress text accompanies the progress bar.
- State is communicated with text and status messages, not colour alone.
- Primary touch controls inherit the 48-pixel Material UI target baseline.

## Known limitations

- Background alarm reliability still depends on the existing native Android permissions and exact-alarm capability; web/PWA alerts remain best effort.
- The redesign currently applies to the active-workout route only.

## Rollback

Revert the three changed active-workout files listed above. No data rollback or migration recovery is required.

## Provenance

No donor source code, external assets, second user-interface framework, or new dependency was introduced. The approved prototype and specification blueprints were reimplemented with Material UI.
