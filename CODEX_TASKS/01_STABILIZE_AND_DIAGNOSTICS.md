# Task 01 — Stabilize foundation and add diagnostics

## Prerequisite

CP0 accepted.

## Objective

Produce a clean, static, privacy-preserving engineering foundation with build identity and enough diagnostics to debug every later checkpoint.


## Owned requirement IDs

`FND-010`, `FND-011`, `FND-012`, `SEC-010`, `SEC-011`, `PWA-010`, `PWA-011`, `DIA-010`, `DIA-011`, `DIA-012`, `DIA-013`, `DIA-014`, `DIA-015`, `DIA-016`.

## Scope

### Runtime and build

- pin supported Node/npm based on CP0;
- preserve one lockfile;
- establish strict TypeScript;
- establish lint, unit test, build, `doctor`, `audit:project`, `audit:network`, `audit:licenses`, and `quality`;
- fail CI on hidden errors;
- create production bundle report;
- configure GitHub Pages subpath build/smoke.

### Privacy cleanup

- remove Sentry;
- remove Alceris;
- remove analytics/telemetry;
- remove unneeded remote scripts/fonts;
- prevent personal production console logs;
- add unexpected-origin audit.

### Build identity

Implement and display:

- app version;
- Git SHA;
- build time;
- database/export/seed/generator/cache versions.

### Diagnostics foundation

Implement:

- stable error-code type/registry;
- central redaction;
- bounded DiagnosticEvent storage;
- global unhandled-error/rejection capture;
- root and route error boundaries;
- operation/migration journal foundation;
- initial Diagnostics screen;
- copyable error ID;
- basic non-destructive self-test;
- diagnostic event clear action.

### Progressive Web App foundation

- audit/fix manifest and icons;
- configure prompt update;
- expose waiting/update state;
- do not auto-reload;
- ensure service-worker/cache identity is visible;
- do not add user-media cache.

### Continuous integration

Pull-request quality workflow:

- clean install;
- typecheck;
- lint;
- architecture check;
- unit tests;
- migration baseline test;
- production build;
- bundle report;
- network/privacy scan;
- licence/provenance scan;
- artifacts.

## Non-goals

- no visual redesign beyond Diagnostics/recovery scaffolding;
- no database-domain redesign;
- no exercise import;
- no program generator;
- no photo feature;
- no donor UI adaptation yet.

## Required tests

- redaction cannot pass fixture secrets/sensitive values;
- event retention bounds;
- intentional root/route error receives code/build ID;
- network scan detects a forbidden test origin;
- GitHub Pages subpath production smoke;
- service worker waits rather than auto-reloads;
- build identity matches injected values;
- existing database opens unchanged.

## Audit

Run and attach:

- `doctor`;
- `audit:project`;
- `audit:network`;
- `audit:licenses`;
- full quality gate.

## Deliverables

- code/tests/workflows;
- `docs/reports/01-stabilization-audit.md`;
- `docs/reports/01-cp1-checkpoint.md`;
- updated traceability/risk/known failures;
- screenshots of Diagnostics and recovery boundary.

## CP1 exit gate

- production build works under project subpath;
- no telemetry/unapproved runtime origin;
- build/schema identity visible;
- induced error is redacted and traceable;
- audit artifact generated;
- existing user data remains compatible;
- all CP1 gates pass.

Open one pull request and stop.
