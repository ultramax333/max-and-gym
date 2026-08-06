# RepQuest migration strategy

## Principle

Do not perform a big-bang rewrite. Establish a stable baseline, place adapters around useful RepQuest behavior, deliver one dependable vertical slice, then migrate feature by feature.

## Step 0 — Pin reality

Task 00 records:

- RepQuest immutable commit;
- current package lock;
- Node and npm versions;
- existing database name and versions;
- current routes;
- current service worker;
- current build/deploy behavior;
- current telemetry;
- current features and tests.

No migration plan is valid before this inventory.

## Step 1 — Stabilize without changing product behavior

- get clean install/build/test;
- pin runtime versions;
- remove telemetry;
- add build identity;
- add error boundaries;
- add diagnostic event framework;
- add GitHub Pages production smoke test;
- preserve existing database and behavior.

## Step 2 — Introduce seams

Create repository/application-service interfaces around existing access:

- workouts;
- exercises;
- body metrics;
- settings.

Initially adapters may delegate to existing RepQuest code. This avoids rewriting everything at once.

## Step 3 — New shell around existing capability

- introduce max&gym theme;
- create route shell and navigation;
- keep legacy screens behind controlled routes if needed;
- migrate one screen at a time;
- no parallel duplicate databases.

## Step 4 — Workout vertical slice

Migrate the complete critical flow first:

```text
Home → Start/Resume → Log Set → Rest → Finish → Summary
```

Do not migrate exercise import, program generation, or charts before this flow is reliable.

## Step 5 — Exercise library and content

- add reviewed seed schema;
- migrate exercise identifiers safely;
- preserve legacy exercise links;
- create aliases/mapping table if source identifiers differ;
- never orphan historical workout sets.

## Step 6 — Programs and generator

- add program entities and prescriptions;
- snapshot prescriptions into workout sessions;
- keep history immutable;
- add deterministic generator after manual builder works.

## Step 7 — Body/photos/backup

- migrate existing body metrics;
- introduce Blob media tables;
- add export format and recovery tests;
- do not store photos until backup support exists in the same checkpoint.

## Legacy compatibility policy

- Historical workout data remains viewable.
- Missing old fields receive documented defaults.
- Deleted/archived exercises remain resolvable in history.
- Program edits do not rewrite completed sessions.
- A legacy import path may be temporary but must be tested until explicitly retired.
- No database rename without a documented origin/storage migration plan.

## Strangler pattern

A legacy module may remain while a replacement is built, provided:

- a single owner controls each persisted entity;
- writes are not duplicated across two stores;
- route boundaries are clear;
- migration status is documented;
- removal has tests proving equivalent behavior.

## Rollback strategy

Before schema-affecting checkpoints:

- create anonymous fixture backup;
- create pre-migration snapshot capability;
- retain previous deploy artifact/tag;
- document whether rollback of code is safe against the newer database;
- when rollback is unsafe, provide forward recovery instead.

## Prohibited migration shortcuts

- delete IndexedDB and start fresh;
- rename the database without migration;
- change identifiers and ignore historical references;
- maintain two writable workout stores;
- combine full database rewrite with full UI redesign;
- ship a schema change without fixtures;
- rely only on manual testing.
