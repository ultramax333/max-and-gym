# Task 03 — Dependable workout vertical slice

## Prerequisite

CP2 accepted.

## Objective

Deliver the first internal gym-ready product:

```text
Home → Start/Resume → Complete Set → Rest → Finish → Summary
```

Reliability outranks feature breadth.


## Owned requirement IDs

`WKT-001`, `WKT-002`, `WKT-003`, `WKT-004`, `WKT-005`, `WKT-006`, `WKT-007`, `WKT-008`, `WKT-009`, `WKT-010`, `WKT-011`, `WKT-012`, `WKT-013`, `WKT-014`, `PWA-020`, `PWA-021`.

## Audit first

Before implementation, document current RepQuest:

- session creation;
- current exercise/set state;
- data writes;
- timer;
- refresh recovery;
- completion;
- duplicate risks;
- direct Dexie use;
- error behavior.

Create `docs/reports/03-workout-current-state-audit.md`.

## Architecture

- define/use `WorkoutRepository` and application service boundary;
- do not call Dexie directly from UI;
- one active/paused session invariant;
- create session transactionally before navigation;
- snapshot required prescription/exercise display fields;
- use operation IDs for set completion, undo, and finish;
- transactions for set + session position + timer start;
- persist timer timestamps;
- error codes and diagnostic events for every critical failure.

## User interface

Implement the active-workout blueprint:

- sticky header;
- exercise media placeholder/current media;
- previous performance;
- responsive set cards/table;
- planned/actual load;
- planned/actual repetitions;
- optional effort;
- Complete Set;
- Undo;
- rest bar/sheet;
- pause/resume;
- finish;
- summary.

At this phase, use existing exercises/program/session fixtures or manually selected content. Do not wait for the full exercise library.

## Timer

- truth is `startedAt`/`endsAt`;
- reconcile on visibility/focus/boot;
- pause/resume;
- add/subtract time;
- skip;
- best-effort sound/vibration;
- wake lock while active when supported;
- accurate copy about Android limitations.

## Recovery

Test:

- refresh;
- browser close/reopen;
- temporary offline;
- waiting service worker;
- duplicate start;
- double complete tap;
- failed transaction;
- invalid timer owner;
- finish retry.

A recoverable inconsistency is repaired with a diagnostic event. A blocking inconsistency offers Diagnostics and safe export/recovery, never silent deletion.

## Non-goals

- full exercise import;
- program builder;
- automatic generator;
- progression engine beyond placeholder pending proposal;
- progress charts;
- photos/backup.

## Required tests

- repository transactions;
- unique operation IDs;
- double-tap/retry idempotency;
- failed write rollback;
- timer fake clock;
- visibility/background;
- active-session recovery;
- one-active invariant;
- undo;
- finish retry;
- service-worker update deferral;
- complete offline end-to-end journey.

## Manual Android evidence

Complete a realistic sample session on Android Chrome:

- install;
- start;
- log several sets;
- background timer;
- refresh;
- go offline;
- resume;
- finish;
- inspect summary.

## Deliverables

- `docs/reports/03-workout-reliability-audit.md`;
- `docs/reports/03-cp3-checkpoint.md`;
- diagnostic error-code additions;
- screenshots/traces;
- updated known failure modes.

## CP3 exit gate

- internal gym session works offline;
- no duplicate/lost set in tested failure paths;
- exact resume works;
- timer truth survives throttling;
- waiting update does not interrupt;
- induced failure is traceable;
- CP3 report accepted.

Open one pull request and stop.
