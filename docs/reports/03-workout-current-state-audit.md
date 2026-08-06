# Task 03 current workout state audit

Date: 2026-08-06

## Legacy RepQuest flow

- Session creation lived in WorkoutContext and initialized React state before
  durable session ownership existed.
- Current exercise and set position were reconstructed from mutable workout,
  workout-exercise and exercise-set records plus a serialized localStorage context.
- The workout UI called Dexie tables directly for history edits and other actions.
- Set saving used a transaction for exerciseSet and workoutExercise, but generated
  replacement workout-exercise identifiers and did not use an operation identifier.
- Rest time was React state based on a start time and duration; there was no durable
  timer entity or persisted end timestamp.
- Refresh recovery depended on serializing a broad context object into localStorage.
- Completion primarily cleared in-memory state and created a post-workout view;
  there was no immutable session completion record.
- Double taps, retry after an uncertain commit, two active sessions and finish retry
  had no durable idempotency guard.
- Critical failures did not consistently produce workout-specific diagnostic events.

## CP3 boundary decision

The legacy editor and history remain available, but the new dependable route uses:

- additive Dexie schema version 4 tables for session, session exercise, performed set,
  rest timer and workout operation;
- DexieWorkoutRepository as the only table-access layer for the new route;
- WorkoutApplicationService for operation journaling, diagnostics, recovery and the
  active-session marker;
- immutable exercise and prescription display snapshots;
- a single active/paused session invariant.

The new UI never calls a Dexie table directly. Existing legacy data is not deleted or
rewritten by the additive migration.
