# Task 06 — Deterministic generator and progression

## Prerequisite

CP5 accepted.

## Objective

Generate explainable two-/three-day programs, 40-/60-minute sessions, 10-/15-minute core sessions, warm-ups, and confirmed progression proposals.


## Owned requirement IDs

`GEN-001`, `GEN-002`, `GEN-003`, `GEN-004`, `GEN-005`, `GEN-006`, `GEN-007`, `GEN-008`, `GEN-009`, `GEN-010`, `GEN-011`, `GEN-012`, `GEN-013`, `GEN-014`, `GEN-015`, `GEN-016`, `GEN-017`, `GEN-018`.

## Domain isolation

The generator is pure domain code:

- no React;
- no Dexie;
- no current clock except injected value;
- deterministic ordering;
- explicit version and seed;
- normalized inputs;
- testable candidate/exclusion explanation.

## Constraint service

One shared service is used by:

- generation;
- substitution;
- warm-up;
- core;
- conditioning;
- accessory regeneration.

Hard exclusions occur before scoring and a post-generation validator must fail closed.

## Structures

- two days: Full Body A/B;
- three days: Full Body A/B/C;
- strength emphasis on primary movement;
- hypertrophy on secondary/accessory work;
- low-impact conditioning as time permits;
- main exercises stable 4–6 weeks;
- accessories rotate 2–4 weeks;
- Regenerate Accessories never changes locked main work.

## Duration

Implement the complete estimator from Task 05 and iterative selection:

- fit target tolerance;
- remove lowest-priority optional work first;
- never shorten primary rest below minimum;
- show duration breakdown/warnings.

## Core and warm-up

- 10/15-minute core;
- controlled position clustering;
- no rapid floor/standing transition;
- 4–6-minute dynamic warm-up;
- optional low-back-comfort sequence;
- ramp-up sets.

## Explanation

Store/show:

- normalized inputs;
- exclusions and reasons;
- chosen movement roles;
- chosen exercise reasons;
- duration breakdown;
- weekly balance;
- seed/version;
- warnings.

## Progression

Implement:

- double progression;
- fixed increment;
- top-set/back-off;
- conditioning time progression;
- manual hold;
- deload review.

Every result is a pending proposal. Accept/edit/reject/postpone are explicit transactional actions.

Discomfort linked to an exercise holds increase proposals.

## Seed content

Implement the seed programs in `docs/spec/SEED_PROGRAMS.md` as reviewed fixtures/templates and use them in tests.

## Tests

- all four frequency/duration combinations;
- core 10/15;
- 100+ hard-exclusion representative seeds;
- deterministic result;
- candidate scoring snapshots;
- locked exercise preservation;
- duration bounds;
- weekly coverage;
- no incompatible group;
- progression success/hold/regression;
- discomfort hold;
- accept/edit/reject/postpone;
- generator version migration/compatibility.

## Deliverables

- `docs/reports/06-generator-validation.md`;
- `docs/reports/06-progression-validation.md`;
- `docs/reports/06-cp6-checkpoint.md`.

## CP6 exit gate

- valid deterministic plans;
- constraints never bypassed;
- duration within defined ranges;
- explanations available;
- no silent progression;
- CP6 report accepted.

Open one pull request and stop.
