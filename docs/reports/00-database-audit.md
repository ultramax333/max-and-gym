# Task 00 — database audit

- Foundation commit: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Current primary schema: Dexie version 3
- Current master schema: Dexie version 1

## Database names

| Database | Selection | Purpose |
|---|---|---|
| `weightlog` | default user | workouts, exercises, sets, plans, metrics |
| `weightlog-<userName>` | non-default local account | same per-user data |
| `system` | fixed | local user/account records |
| `sentry-offline` | only when Sentry is enabled | queued telemetry; must be removed |

Changing the user name changes the data database. This creates an apparent-data-loss risk and conflicts with the single-user target.

## Tables and indexes

### `weightlog` version 3

| Table | Index declaration | Notes |
|---|---|---|
| `exercise` | `++id, name, type, *tags` | numeric key; `type` is not present in the current TypeScript interface |
| `workout` | `++id, name` | template record, not completed session |
| `workoutHistory` | `++id, userName, date, workoutExerciseIds` | declared but not exposed by the Dexie class or used by current code |
| `workoutExercise` | `++id, exerciseId, setIds` | array references to set records |
| `exerciseSet` | `++id, exerciseId, type` | performed/planned state mixed through `initial` and optional `date` |
| `user` | `++name` | declared in the data database but not exposed/used |
| `userMetric` | `++id, metric` | body measurements |
| `plan` | `++id, workoutId, name` | declaration says singular `workoutId`; model uses `workoutIds` |

Version 2 differs only because `userMetric.metric` was not indexed. No explicit Dexie `upgrade()` transform, migration journal, fixture, or postcheck exists.

### `system` version 1

| Table | Index declaration |
|---|---|
| `user` | `++name` |

The `++name` declaration attempts auto-increment semantics on a string-like user name and requires controlled compatibility testing before replacement.

## Relationships

```text
Plan.workoutIds[] -> Workout.id
Workout.workoutExerciseIds[] -> WorkoutExercise.id
WorkoutExercise.exerciseId -> Exercise.id
WorkoutExercise.setIds[] -> ExerciseSet.id
ExerciseSet.exerciseId -> Exercise.id
UserMetric is independent
```

Relationships are application-maintained arrays with no referential postcheck. Workout and workout-exercise records are cloned to new numeric IDs during editing/completion, which can leave obsolete/orphan records.

## Active workout and timer

There is no active-session table, status index, operation journal, or timer table. The current session and rest state live in `localStorage.workoutContext`. This state contains names, set values, current records, and timing data in one mutable JSON object.

Consequences:

- IndexedDB transactions cannot atomically save the active position and timer;
- duplicate taps/retries have no unique operation guard;
- `localStorage` quota/parse failures are not handled;
- more than one tab can overwrite session state;
- recovery cannot verify foreign-key ownership;
- diagnostic export redaction is difficult.

## Backup/import

The current backup is unversioned JSON without manifest, schema validation, checksums, size limits, or media support. `restoreBackup` clears six tables inside the import transaction at `src/db/backup.ts:148-153` before bulk insertion. A transaction offers some rollback protection, but malformed payloads are not staged or previewed and settings outside IndexedDB are updated separately.

The import must be preserved only as a legacy compatibility reader until the versioned `.maxgym` archive exists.

## Current-to-target entity mapping

| Current | Target | Migration approach |
|---|---|---|
| localStorage/settings + `system.user` | `AppSettings`, `UserTrainingProfile`, `EquipmentProfile`, constraints | normalize singleton values; preserve unknown legacy settings in compatibility evidence |
| `exercise` | `Exercise`, `ExerciseMedia` | stable legacy alias map; do not overwrite user edits |
| `plan` | `Program` | map status/source defaults and retain legacy numeric ID |
| `workout` | `ProgramDay` plus historical template snapshot | distinguish templates from performed sessions |
| `workoutExercise` | `ProgramExercise`, `SessionExercise` | classify `initial` versus performed usage and snapshot names/prescriptions |
| `exerciseSet` | `ExercisePrescription` or `PerformedSet` | `initial=true` becomes prescription; dated/non-initial becomes history |
| `userMetric` | `BodyMeasurement` | map metric names/units and convert dates consistently |
| `localStorage.workoutContext` | `WorkoutSession` + `RestTimerState` | one-time guarded recovery migration after CP3 repository exists |
| none | journals, diagnostics, proposals, photos/media | add sequentially in owning checkpoints |

## Blocking controls for schema work

1. Capture anonymous fixtures for empty, minimal, history, and active-workout baselines.
2. Never rename `weightlog` or delete it as a shortcut.
3. Add repositories before moving UI writes.
4. Add migration/operation journals and postchecks in CP1.
5. Preserve numeric legacy identifiers through an alias/mapping layer.
6. Treat code rollback as potentially unsafe after a forward schema migration and document a forward-fix path.
