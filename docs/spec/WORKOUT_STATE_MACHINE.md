# Workout and timer state machines

## 1. Workout session state

```text
PLANNED
  └─ start(operationId) → ACTIVE

ACTIVE
  ├─ pause → PAUSED
  ├─ finish(operationId) → COMPLETED
  └─ abandon(operationId, confirmation) → ABANDONED

PAUSED
  ├─ resume → ACTIVE
  ├─ finish(operationId) → COMPLETED
  └─ abandon(operationId, confirmation) → ABANDONED
```

Invalid:

- second ACTIVE session while one exists;
- COMPLETED → ACTIVE;
- ABANDONED → ACTIVE;
- finish without a valid session snapshot.

A completed/abandoned session is immutable except explicit metadata correction with audit trail.

## 2. Session exercise state

```text
PENDING → ACTIVE → COMPLETED
             ├─ SKIPPED
             └─ SUBSTITUTED (actual replacement then follows active/completed)
```

Original exercise identity is preserved on substitution.

## 3. Set state

```text
PLANNED
  ├─ complete(operationId) → COMPLETED
  └─ skip(operationId) → SKIPPED

COMPLETED
  └─ undo(operationId) → UNDONE
```

Rules:

- repeated completion operation ID returns the original result;
- a new operation for an already-completed set is rejected or treated as explicit edit, never duplicate completion;
- set, session position, and timer creation are one transaction;
- UI shows pending until commit.

## 4. Rest timer state

```text
IDLE
  └─ start → RUNNING

RUNNING
  ├─ pause → PAUSED
  ├─ expire → COMPLETED
  ├─ skip → CANCELLED
  └─ workout finish/abandon → CANCELLED

PAUSED
  ├─ resume → RUNNING
  └─ skip/workout finish → CANCELLED
```

Truth:

- RUNNING uses `endsAt`;
- PAUSED uses `remainingWhenPausedSeconds`;
- interval ticks are presentation only.

## 5. Recovery algorithm

At boot:

1. query active/paused sessions;
2. if zero, normal boot;
3. if one, validate exercise/set/timer references;
4. reconcile timer from timestamps;
5. repair safe derived fields;
6. record repair diagnostic;
7. show Resume;
8. if more than one, block new start, run integrity analysis, and offer controlled resolution;
9. never delete automatically.

## 6. Complete-set transaction

Inputs:

- session ID;
- session exercise ID;
- planned set ID;
- actual values;
- operation ID;
- current build/schema.

Transaction:

1. check operation journal for committed ID;
2. validate active session ownership;
3. validate set is completable;
4. save performed values/status/timestamp;
5. advance session position;
6. create/update rest timer;
7. write operation committed;
8. commit.

On failure:

- transaction rolls back;
- operation marked failed if possible;
- UI reverts pending state;
- error code recorded;
- Retry creates/reuses correct operation policy.

## 7. Working-set trade transaction

An active or paused session may add one working set to its current exercise while preserving the planned session target:

1. validate the current exercise and idempotency operation ID;
2. find an untouched pending exercise with more than two working sets;
3. choose the donor whose set-time estimate is closest to the added set;
4. copy the current exercise's final working-set target before any drop set;
5. remove only the donor's final unstarted working set;
6. update both prescription snapshots and commit one `adjust-sets` operation.

Completed, undone, started, warm-up and drop sets are never donated. If no safe donor exists, the transaction rolls back and the user keeps the original plan.

## 8. Finish transaction

1. reject duplicate finish operation by returning prior result;
2. validate active/paused ownership;
3. mark remaining planned items appropriately only after user confirmation;
4. set completed status/end time/elapsed;
5. cancel timer;
6. release active pointer;
7. calculate persisted summary/record source links;
8. create pending progression proposals;
9. commit.
