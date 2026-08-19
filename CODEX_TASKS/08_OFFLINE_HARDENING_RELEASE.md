# Task 08 — Hardening and version-1 release

## Prerequisite

CP7 accepted.

## Objective

Resolve defects, prove the complete contract, and deploy version 1. Do not add new features.


## Owned requirement IDs

`FND-090`, `PWA-090`, `UI-090`, `UI-091`, `FND-091`, `SEC-090`, `SEC-091`, `BKP-090`, `DIA-090`, `FND-092`, `FND-093`, `FND-094`.

## Freeze rules

Allowed:

- bug fixes;
- reliability;
- accessibility;
- performance;
- offline/update;
- documentation;
- privacy/security/licence;
- test coverage;
- release tooling.

Not allowed:

- new feature;
- new data category;
- new UI framework;
- backend/sync;
- video;
- new split/generator mode;
- speculative refactor without release value.

## Full verification

Run every acceptance test in `docs/spec/ACCEPTANCE_TESTS.md`.

Required audits:

- project;
- dependencies;
- architecture;
- database/migrations;
- network/privacy;
- service worker/cache;
- assets;
- licences/provenance;
- accessibility;
- bundle/performance;
- diagnostic redaction;
- backup/recovery.

## Android matrix

On a representative Android phone/current Chrome:

- install;
- fresh onboarding;
- existing-data update;
- 360/412-style responsive behavior;
- active workout;
- background/foreground timer;
- reload/reopen recovery;
- sound/vibration;
- wake lock;
- offline launch;
- waiting update during workout;
- camera/gallery photo;
- backup download/import;
- diagnostics export;
- storage warning.

Document platform limitations honestly.

## Recovery drill

1. create representative anonymous local data;
2. export backup;
3. record build/schema identity;
4. clear local data;
5. restore;
6. verify counts/media/history;
7. update application;
8. run self-test;
9. verify offline.

## Production

- prepare release notes;
- update version;
- ensure Git SHA/build identity;
- tag release candidate;
- deploy production artifact;
- run production smoke;
- verify network origins;
- verify service-worker update from previous build;
- tag `v1.0.0` after acceptance.

## Deliverables

- `docs/reports/08-full-acceptance-report.md`;
- `docs/reports/08-android-test-matrix.md`;
- `docs/reports/08-performance-accessibility-audit.md`;
- `docs/reports/08-privacy-licence-audit.md`;
- `docs/reports/08-release-checklist.md`;
- `docs/reports/08-cp8-checkpoint.md`;
- final user documentation and release notes.

## CP8 exit gate

- no release blocker;
- priority-zero tests pass;
- production identity matches tag;
- offline/update/recovery proven;
- no unapproved network request;
- licences/provenance complete;
- production smoke passes;
- CP8 report accepted.

Open the release pull request, report its status, and stop. After all required checks pass, ask the project owner whether to merge that specific pull request and commit. Merge only after a fresh explicit approval replying to that request. Do not publish a tag manually unless separately authorized; the trusted release workflow may publish its documented tag after an approved merge.
