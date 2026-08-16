# Generator, saved sessions, active-session dock and glute cable audit

Date: 2026-08-16

Mode: DIAGNOSE. This report does not authorize or apply product-code changes.

## Scope

Audit five user-visible issues as one coherent release candidate:

1. bodyweight exercises remain available when `body only` is unchecked;
2. quick-session generation has no Strength / Endurance / Hypertrophy choice;
3. saved single sessions are difficult to find and restart;
4. there is no persistent control outside the workout screen to resume or finish the active session;
5. the focused Glutes pool needs more useful choices, especially without cables.

## Proven findings

### 1. Bodyweight exclusion is a real filtering bug

`evaluateHardConstraints` treats every `body only` candidate as available, independently of the selected equipment:

```ts
candidate.equipmentTags.includes('body only')
    || candidate.equipmentTags.some((tag) => input.equipment.includes(tag))
```

The same unconditional exception is duplicated in quick-session replacement filtering and manual replacement validation. Both reviewed push-up records (`Pushups` and `Push-Ups With Feet Elevated`) therefore pass the current condition after `body only` is unchecked.

Required correction: one shared strict equipment predicate. A candidate is available only when at least one of its equipment tags is explicitly selected, including `body only`.

### 2. Quick sessions are hard-coded to hypertrophy

`QuickSessionBuilder` always sends `goal: 'hypertrophy'`. Its prescription function does not receive the goal and always returns the same set and repetition ranges. The weekly generator exposes Strength / Balanced / Hypertrophy, but its current `goal !== 'hypertrophy'` branch also treats Balanced as Strength for primary lifts.

Required correction:

- expose Strength / Endurance / Hypertrophy in both generator modes;
- preserve `balanced` as a read-compatible legacy value for stored snapshots, but remove it from the new UI;
- centralize goal-specific prescriptions instead of duplicating partial logic;
- make the time estimate goal-aware because higher-repetition endurance sets take longer than strength sets;
- keep the user's explicit global recovery choice authoritative and show the goal-recommended value rather than silently overriding a custom value;
- bump the generator version so old and new generated snapshots remain explainable.

### 3. Saved single sessions are stored but poorly surfaced

`Save and edit` calls `ProgramRepository.createGenerated`. A one-day generated session becomes a `draft` training program with `weeklyFrequency: 1`. The Programs screen opens on `Active`, so the saved item is hidden under `Drafts`. It is labelled `1 days/week`, and a draft cannot be started directly from the list or detail page without activation. The empty-state copy also says programs contain two or three days.

Required correction without a database migration:

- treat existing one-day records as saved session templates (`weeklyFrequency === 1`);
- label the action `Save to My sessions` and confirm the destination;
- add a visible `Saved sessions` section/entry from Train and Programs;
- show session-specific labels instead of `1 days/week`;
- allow a saved one-day template to start directly without making it the active weekly program;
- retain rename, exercise editing, reordering, duplication and archive support.

### 4. Active workout controls exist only on Home and the workout page

Home already exposes Resume and a confirmed Stop action. The reusable bottom/side navigation contains only Home, Train, Programs, Progress and Library. Generator and program-detail pages hide that navigation entirely. There is no global active-session affordance.

Required correction: a persistent active-workout dock rendered by the shared layout whenever a session is active and the current route is not the active-workout route. It should show the session name, Resume and Finish. Finish must open a confirmation explaining that completed sets remain saved and remaining sets remain incomplete, then use the existing `finish` operation and open the summary. The dock must account for the Pixel/Android safe area and must not cover scrollable content or the bottom navigation.

### 5. The Glutes filter is too strict for useful non-cable compound movements

The reviewed catalogue contains 302 exercises. The focused Glutes pool currently contains 10 eligible exercises because zone matching accepts only `glutes` or `abductors` as a primary muscle. Eight of those ten choices do not require a cable:

- Barbell Hip Thrust;
- Butt Lift (Bridge);
- Glute Kickback;
- Hip Extension with Bands;
- Monster Walk;
- Single Leg Glute Bridge;
- Step-up with Knee Raise;
- Thigh Abductor.

The catalogue already contains many useful non-cable compound movements where glutes are a secondary muscle, including Romanian Deadlift, Split Squat with Dumbbells, Dumbbell Rear Lunge, Kettlebell One-Legged Deadlift, Wide Stance Barbell Squat, Barbell Walking Lunge and Leg Press. They are invisible in a Glutes session because the current matcher ignores secondary-muscle relevance.

Recommended correction: add a curated generator-focus classification for exercises that materially train glutes without falsifying their primary-muscle metadata. Admit only a small, distinct set covering hinge, unilateral squat/lunge, wide-stance squat and machine press patterns. Do not admit every exercise that merely lists glutes secondarily, and do not add cosmetic stance or attachment variants.

## Implementation boundary

The proposed release should update generator logic and tests, generator UI, saved-session discovery/start behavior, shared layout navigation, and curated focus metadata for existing reviewed exercises. It should not change completed workout history, Android update/install behavior, backup format, or trail-related functionality.

## Verification plan

- generator unit tests proving `body only` is excluded from generation and replacements when unchecked;
- goal-prescription tests for Strength, Endurance and Hypertrophy, including duration tolerance and chosen recovery;
- component tests for the goal control and save destination copy;
- repository/page tests proving existing one-day drafts appear under Saved sessions and start directly;
- shared-layout tests proving the active dock resumes, confirms finish and disappears after completion;
- catalogue/generator tests proving the curated non-cable Glutes choices are relevant, distinct and still obey selected equipment;
- Pixel-width route smoke to verify dock, bottom navigation, safe-area spacing and scrolling;
- full project quality, Android build/smoke and release audits before checkpointing.

## Baseline verification

The existing targeted suites remain green before changes: 3 test files and 22 tests passed (`quickSession`, `ProgramPages`, `ShellPages`). These suites currently lack assertions for the five gaps above.

## Resolution

Implemented in the `1.6.0` release candidate after the diagnostic boundary was lifted by the user's `Go` authorization:

- strict selected-equipment filtering is shared by generation and replacement flows;
- Strength, Hypertrophy and Endurance use distinct prescriptions and time estimates;
- one-day generated templates are exposed as Saved sessions and can start directly;
- a persistent active-workout dock provides Resume and confirmed Finish actions;
- six reviewed, non-cable compound movements carry explicit Glutes generator-focus metadata without altering their source anatomy.

Final verification passed: TypeScript, zero-warning lint, 50 test files / 198 tests, GitHub Pages production smoke, Android web-bundle smoke, and all eleven release audits. Interactive device-browser inspection was unavailable because no browser session was connected; mobile behavior remains covered by component, route and Android bundle checks.
