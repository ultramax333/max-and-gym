# Task 00 — migration plan

## Strategy

Use RepQuest as a compatibility foundation and migrate by strangler pattern. Do not combine database replacement, workout rewrite, and visual redesign in one change. At each stage there is one writer for each persisted entity and the prior database remains recoverable.

## Phase sequence

### 1. CP1 — clean foundation and diagnostics

- Pin a supported Node/npm pair and keep the npm lockfile.
- Make typecheck, lint, tests, stock production build, and CI failures explicit.
- Remove Alceris, Sentry, Supabase, cloud/account/telemetry/EOL remote paths, remote fonts/media dependencies, and sensitive console output.
- Add build identity, stable error codes, redaction, bounded diagnostic events, root/route boundaries, `doctor`, and audit commands.
- Introduce migration and operation journals without changing legacy tables destructively.
- Set the GitHub Pages subpath and replace service-worker auto-update with a prompt.

Rollback: no destructive schema change. A code revert remains safe after removing network services and adding additive diagnostics.

### 2. CP2 — max&gym shell

- Add the dark max&gym MUI theme and responsive shell.
- Add Home/Train/Programs/Progress/Library route shells.
- Keep legacy RepQuest routes behind explicit compatibility routes where necessary.
- Add loading, empty, error, offline, focus, and reduced-motion states.

Rollback: legacy routes remain reachable and the database is unchanged.

### 3. CP3 — dependable workout vertical slice

- Define `WorkoutRepository` and application commands around current Dexie access.
- Introduce additive `WorkoutSession`, `SessionExercise`, `PerformedSet`, `RestTimerState`, and operation-journal records.
- Build idempotent Start/Resume, Complete Set, Undo, Rest, Pause, Finish, and Recovery transactions.
- Add a guarded one-time adapter for recoverable `localStorage.workoutContext` state.
- Snapshot names and prescriptions so completed history no longer depends on mutable templates.

Rollback: schema migration is forward-aware; keep legacy readers and document whether the previous build can open the additive schema. Prefer forward repair after data has been written to new tables.

### 4. CP4 — reviewed exercise library

- Pin Free Exercise DB at an immutable commit.
- Build an allowlist/override/validation pipeline and local paired-image assets.
- Create stable namespaced IDs plus a legacy numeric-ID alias map.
- Never orphan historical sets and never auto-select unreviewed or blocked exercises.

### 5. CP5 — manual programs

- Introduce Program, ProgramDay, ProgramExercise, prescription, grouping, and duration entities behind repositories.
- Migrate legacy Plan/Workout templates with preserved IDs and immutable session snapshots.
- Deliver create/edit/reorder/duplicate/archive/activate before automatic generation.

### 6. CP6 — deterministic generator and progression

- Add normalized input, shared hard filters, stable scoring/tie breaks, duration validation, explanations, and versioned seeds.
- Apply no progression automatically; persist proposals and require confirmation.

### 7. CP7 — progress, photos, and backup

- Migrate legacy user metrics to typed measurements.
- Add local Blob media only together with compression, quota handling, cleanup, and backup support.
- Replace unversioned JSON export with checksummed `.maxgym` staging/Replace/Merge flows.
- Keep a legacy JSON import reader until deliberately retired.

### 8. CP8 — release hardening

- Run the complete Android/offline/update/migration/backup/accessibility/network/licence suite.
- Optimize route chunks and media against the CP0 bundle baseline.
- Deploy one verified artifact with matching build identity and a forward-recovery plan.

## Current entity ownership during migration

| Entity | Initial owner | Transitional seam | Target owner |
|---|---|---|---|
| Exercises | RepQuest Dexie/table callers | `ExerciseRepository` adapter | max&gym data layer |
| Plans/templates | RepQuest `plan/workout/workoutExercise` | program compatibility adapter | Program repositories |
| Performed sets | RepQuest `exerciseSet` | workout repository with legacy mapping | Workout aggregate repositories |
| Active workout | localStorage context | guarded recovery importer | persisted WorkoutSession |
| Metrics | `userMetric` callers | `BodyRepository` adapter | BodyMeasurement repository |
| Settings | localStorage + `system.user` | settings adapter | AppSettings repository |
| Backup | unversioned JSON | legacy reader | versioned archive service |

## Migration gates

- Anonymous fixtures for every supported schema and active-workout shape.
- Counts, relationships, one-active-session, timer ownership, and media postchecks.
- No `db.delete()`, database rename, or unguarded table clear.
- Seed updates separated from user-schema migrations.
- Database/export/seed/generator/cache versions independent.
- Every schema-affecting pull request states code rollback compatibility or forward-fix procedure.
