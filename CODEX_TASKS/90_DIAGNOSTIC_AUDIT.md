# Task 90 — Diagnostic audit and root-cause isolation

This task is invoked when a defect, regression, unexplained data state, deployment failure, or unreliable test appears. It does not advance the CP0–CP8 construction sequence and does not change `PROJECT_STATUS.md` unless a corrective pull request is later accepted.

## Invocation modes

- `MODE=DIAGNOSE` — default. Read-only investigation and report. No product-code changes.
- `MODE=FIX` — diagnose first, then implement the smallest evidence-based correction and its regression test.
- `Go` — project-owner shorthand for `MODE=FIX` when sent as a standalone instruction, matched case-insensitively.

Never infer fix authorization from urgency. `MODE=FIX` or standalone `Go` must be explicit.

## Required context

Read:

- `EXECUTION_CORE.md`;
- `PROJECT_CONTRACT.json`;
- `AGENTS.md`;
- `PROJECT_STATUS.md`;
- `docs/spec/DIAGNOSTICS_AND_AUDIT.md`;
- `docs/spec/AUDIT_AUTOMATION_CONTRACT.md`;
- `docs/spec/DEBUG_PLAYBOOK.md`;
- `docs/spec/KNOWN_FAILURE_MODES.md`;
- `docs/spec/DATABASE_MIGRATION_PROTOCOL.md` when data is involved;
- the relevant state machine;
- the last accepted checkpoint report;
- the supplied bug report and diagnostic export.

## Inputs to request only when absent

- exact reproduction steps;
- expected and observed result;
- app version and Git SHA;
- browser/Android version;
- installed PWA or browser tab;
- online/offline state;
- visible error ID;
- last known good checkpoint;
- redacted diagnostic export;
- relevant continuous-integration failure and logs.

Do not request a personal `.maxgym` backup, photos, notes, loads, repetitions, measurements, or custom exercise names unless the user explicitly decides they are indispensable.

## Phase A — Preserve evidence

1. Confirm repository status, branch, commit, and build identity.
2. Copy supplied logs and reports under `artifacts/incidents/<incident-id>/`; keep these artifacts out of Git when they may contain sensitive or machine-specific data.
3. Record the exact failure signature.
4. Confirm a personal backup exists before any operation that could affect local data.
5. Do not clear browser data, uninstall the PWA, delete caches, reset IndexedDB, or run a destructive migration.

## Phase B — Reproduce and classify

Reproduce in this order where applicable:

1. affected existing profile;
2. same profile after ordinary reload;
3. installed PWA and normal tab comparison;
4. online and offline comparison;
5. service worker controlled and service worker bypassed comparison;
6. clean temporary browser profile with synthetic fixtures;
7. production build under the GitHub Pages subpath;
8. prior known-good checkpoint using the same synthetic fixture.

Classify the first failing subsystem:

- build/deployment;
- route/base path;
- boot/error boundary;
- service worker/cache/update;
- IndexedDB open/schema/migration;
- domain invariant/repository;
- workout operation;
- timer;
- generator;
- media/storage;
- backup/import;
- UI rendering;
- browser capability;
- unexpected network dependency;
- licence/provenance tooling;
- flaky or incorrect test.

Do not label a downstream symptom as the root cause.

## Phase C — Automated evidence

Run the smallest relevant commands first, then the checkpoint gate:

- `npm run doctor`;
- `npm run audit:project`;
- `npm run audit:network` when network/PWA is plausible;
- type check and lint;
- the smallest failing unit/component/migration/end-to-end test;
- production build;
- phase-specific audit.

Create a deterministic failing test before changing code whenever technically possible. When a deterministic regression range exists, use `git bisect` or a checkpoint-to-checkpoint commit comparison.

## Phase D — Root-cause report

Create:

`docs/reports/incidents/<incident-id>-root-cause.md`

Use `docs/templates/ROOT_CAUSE_REPORT_TEMPLATE.md`.

The report must distinguish:

- proven fact;
- inference;
- remaining hypothesis;
- excluded hypothesis;
- first bad commit when known;
- affected data/schema/cache versions;
- affected requirement IDs;
- safety/privacy/licence impact;
- reproduction test;
- minimum correction;
- rollback or forward-recovery path.

A report that says only “cache issue”, “race condition”, “database problem”, or “browser bug” is not sufficient.

## MODE=DIAGNOSE exit

Stop after:

- reproducible case or explicit explanation why reproduction is not yet possible;
- root-cause report;
- failing test or a precise test plan;
- minimal fix proposal;
- list of missing evidence.

Do not modify product code and do not open a corrective pull request.

## MODE=FIX / Go implementation

Only after the report supports a cause:

1. implement the smallest coherent correction;
2. preserve user data;
3. add the regression test;
4. add a stable diagnostic code when the failure class was previously invisible;
5. update `KNOWN_FAILURE_MODES.md` if the class is new;
6. update migrations/state machines/Architecture Decision Records only when the design truly changes;
7. run the full affected checkpoint gate;
8. attach before/after evidence;
9. open one corrective pull request;
10. stop.

## Hard prohibitions

- no “fix” by deleting or resetting IndexedDB;
- no forced service-worker activation during an active workout;
- no broad dependency upgrade unrelated to the cause;
- no refactor mixed into an incident correction;
- no disabling a failing test without proving the test is wrong;
- no logging personal workout values;
- no automatic merge;
- no continuation into the next construction task.
