# Workout generator modern redesign

Date: 2026-08-12

Scope: quick-session generator and generated-session preview

Requirements: deterministic local generation, duration-aware rest budgeting, exercise preview, replacement alternatives, favourites and never-suggest controls

## Outcome

The approved performance-minimalist design is now implemented on the real generator route. The deterministic generator, exercise selection rules, local catalogue, IndexedDB schema, session start flow, save/edit flow, favourites and never-suggest behavior remain unchanged.

## Current behavior

- The most important choices—body area, duration and recovery—are grouped in a compact mobile-first session card.
- Equipment and the reproducible variation seed remain available in a collapsible advanced section.
- Generating again explicitly produces another deterministic variation.
- The generated-session summary presents exercise count, working-set count, estimated duration, start and save/edit actions before the exercise list.
- Each exercise card shows both local movement photos when available, prescription, recovery, selection rationale, favourite control, never-suggest control and a prominent replacement action.
- The replacement dialog keeps its searchable compatible catalogue and the full set/repetition/recovery prescription.
- The weekly-program mode remains available through the same segmented navigation.

## Changed files

- `src/pages/programs/GeneratorPage.tsx`
- `tests/release.spec.ts`

## Data and release impact

- Database schema: unchanged.
- Generator algorithm and scoring: unchanged.
- Export format: unchanged.
- Runtime network origins: unchanged.
- Dependencies: unchanged.
- App version/build number: unchanged; this checkpoint is local and not deployed.

## Verification

- TypeScript: `tsc --noEmit` passed.
- Target ESLint: passed with zero warnings.
- Unit/component suite: 47 files and 185 tests passed.
- Production web build: passed; 13,294 modules transformed.
- GitHub Pages subpath smoke: passed.
- Focused Pixel 9a end-to-end generator journey: passed at 412 × 915.
- Project and accessibility audits: passed.
- Manual Pixel 9a evidence: 6 exercises and 18 working sets for the default 45-minute arms session, about 42 minutes estimated, 12 local images, 40 compatible replacement choices, no horizontal overflow and no console error.

## Accessibility evidence

- Labelled body-area, duration and recovery selectors.
- Semantic page, session and exercise headings.
- Named favourite, never-suggest, start, save and replacement controls.
- Exercise prescription and state are communicated with text, not colour alone.
- Primary controls inherit the 48-pixel Material UI target baseline.

## Known limitations

- The redesign focuses on the quick-session path; the weekly-program form keeps its existing internal layout.
- The exact generated exercises still depend on the selected equipment, local preferences, blocked exercises, favourites and variation seed.

## Rollback

Revert the two changed implementation/test files listed above. No data rollback or migration recovery is required.

## Provenance

No external asset, donor source code, additional user-interface framework or new dependency was introduced. The redesign uses the existing Material UI theme and local exercise imagery.
