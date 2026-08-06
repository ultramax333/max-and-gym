# Task 05 — Program data and migration

## Additive schema

Database schema 6 adds five local IndexedDB tables without changing or deleting RepQuest tables:

- `trainingProgram`: manual, migrated or generated program metadata and status;
- `programDay`: ordered two- or three-day structure;
- `programExercise`: ordered exercise snapshots, role, group, lock and alternatives;
- `exercisePrescription`: working sets, rep range, RIR, rest, tempo and load reference;
- `progressionRule`: explicit progression strategy that always requires approval.

Only one program can be active. Activation demotes the previous active program to draft. Archiving changes status but preserves the aggregate and all workout history.

## Legacy conversion

The Programs screen runs a one-time, non-destructive import only when no new-format program exists. Eligible legacy plans must contain two or three workouts. Workout names, exercise order, initial set count, repetitions and rest are copied into a draft `legacy` program. The source `plan`, `workout`, `workoutExercise`, `exercise` and `exerciseSet` rows remain untouched.

Empty or unsupported legacy plans remain available through the historical RepQuest screens and are not guessed into a new program.

## Session immutability

Starting a program day writes the program/day IDs plus exercise-name and prescription snapshots to the workout session tables. Performed sets are created from that snapshot. Later edits, replacements, archive actions or prescription changes cannot rewrite an existing session.

On successful completion, the active program advances its `currentDayIndex` in the same transaction as workout completion. Idempotent finish operation IDs prevent a double advance.
