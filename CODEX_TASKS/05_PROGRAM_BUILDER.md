# Task 05 — Programs and manual builder

## Prerequisite

CP4 accepted.

## Objective

Let the user construct, edit, understand, and run complete two- or three-day programs before automatic generation exists.


## Owned requirement IDs

`PRG-001`, `PRG-002`, `PRG-003`, `PRG-004`, `PRG-005`, `PRG-006`, `PRG-007`, `PRG-008`, `PRG-009`, `PRG-010`, `PRG-011`, `PRG-012`, `PRG-013`.

## Architecture

Implement:

- Program;
- ProgramDay;
- ProgramExercise;
- ExercisePrescription;
- ProgressionRule;
- alternatives;
- stable/locked fields;
- repository/application services;
- session snapshot boundary.

Completed sessions must never depend on mutable live program content.

## UI

- program list/status tabs;
- program detail;
- create/edit;
- duplicate;
- activate/archive;
- two/three days;
- 40/60-minute target;
- add/remove/reorder exercises;
- non-drag move controls;
- create single/superset/triset/circuit groups;
- set/rep/rest/effort prescriptions;
- assign progression method;
- select alternatives;
- lock main exercise;
- duration breakdown;
- weekly movement/muscle summary;
- warnings.

## Duration estimator

Include:

- general warm-up;
- ramp sets;
- execution;
- programmed rest;
- setup;
- transitions;
- groups;
- conditioning.

Do not shorten primary rest silently.

## Integration

- Home displays active next day;
- Train starts from active program;
- active workout snapshots prescription;
- editing program after start cannot rewrite the session;
- archive preserves history.

## Tests

- CRUD/status;
- ordering;
- grouping;
- accessible move controls;
- duration calculations;
- weekly balance;
- snapshots;
- edit-after-completion immutability;
- alternative/lock data;
- migration from existing structures;
- offline flow.

## Non-goals

- automatic generator;
- automatic progression calculations;
- progress charts/photos.

## Deliverables

- `docs/reports/05-program-data-migration.md`;
- `docs/reports/05-duration-estimator-audit.md`;
- `docs/reports/05-cp5-checkpoint.md`.

## CP5 exit gate

- manual two/three-day program is fully usable;
- duration is transparent;
- completed history immutable;
- accessible editing;
- CP5 report accepted.

Open one pull request and stop.
