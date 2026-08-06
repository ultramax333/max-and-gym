# Task 00 — Audit RepQuest and Workout.cool donor

## Objective

Establish a complete, reproducible baseline and final migration plan. Do not implement product features.


## Owned requirement IDs

`FND-001`, `FND-002`, `FND-003`, `PWA-001`, `SEC-001`, `SEC-002`, `UI-001`, `UI-002`, `DIA-001`, `FND-004`, `FND-005`.

## Mandatory reading

- `PROJECT_CONTRACT.json`
- `README_FIRST.md`
- `AGENTS.md`
- `CODEX_MASTER_PROMPT.md`
- every file under `docs/spec/`
- all current RepQuest repository documentation

## Rules

- Audit before editing.
- Pin immutable commits for RepQuest and Workout.cool.
- Minimal edits are allowed only to make the baseline install/build honestly reproducible.
- Do not change database schema, UI design, routing architecture, exercise data, or product behavior.
- Do not add a second UI framework.
- Stop after the CP0 pull request and report.

## Workstream A — Baseline environment

Record:

- current repository/default branch/commit;
- Node/npm requirements and actual compatible versions;
- lockfile state;
- install command;
- start/build/test/lint commands;
- environment variables;
- current GitHub Actions;
- clean install/build output;
- bundle size and route chunks.

Create:

- `.nvmrc` or equivalent only if required to reproduce the current build;
- `docs/reports/00-baseline-environment.md`.

## Workstream B — Architecture inventory

Map:

- source tree;
- app entry/bootstrap;
- providers;
- routes/screens;
- shared components;
- state management;
- direct data access;
- workout flow;
- timer flow;
- body/metric flow;
- import/export;
- error handling;
- tests.

Create:

- `docs/reports/00-current-architecture.md`;
- module table: Keep / Wrap / Refactor / Replace / Remove.

## Workstream C — Database inventory

Document:

- IndexedDB database name;
- Dexie version;
- tables and indexes;
- entity relationships;
- schema versions;
- migrations;
- active-workout representation;
- timers;
- body measurements;
- current import/export;
- data-loss and origin-change risks.

Create:

- `docs/reports/00-database-audit.md`;
- current-to-target entity map using `docs/spec/DATA_MODEL.md`.

Do not modify schema.

## Workstream D — Progressive Web App and deployment audit

Inspect:

- manifest;
- icons;
- Vite base;
- router;
- service worker;
- cache strategy;
- update behavior;
- offline behavior;
- GitHub Pages workflow;
- direct-route/subpath behavior;
- user-media caching risks.

Create:

- `docs/reports/00-pwa-deployment-audit.md`.

## Workstream E — Privacy/network/licence audit

Find:

- Sentry;
- Alceris script;
- analytics/telemetry;
- remote fonts/scripts/images;
- production console logging;
- runtime network origins;
- secret/environment usage;
- licences and notices.

Create:

- `docs/reports/00-network-privacy-licence-audit.md`.

## Workstream F — Workout.cool donor audit

Pin the current reviewed Workout.cool commit. Do not add it as a package dependency.

Inspect current donor areas such as:

- components/shared UI;
- layout/navigation;
- exercise entity/cards/details;
- exercise search/filter;
- programs;
- workout builder;
- workout session;
- statistics/charts;
- loading/empty/error states.

Fill:

- `docs/reports/00-ui-donor-matrix.md` based on `docs/templates/UI_DONOR_MATRIX_TEMPLATE.md`.

Classify every candidate:

- A — inspire only;
- B — reimplement algorithm/interaction;
- C — isolated client code candidate;
- D — reject.

Explicitly reject server actions, Prisma, PostgreSQL, Better Auth, Stripe, advertisements, premium, email, leaderboards, social systems, framework-coupled components, and unverified media.

## Workstream G — Risk and sequence validation

Update:

- `docs/spec/RISK_REGISTER.md` with audit-specific evidence;
- `docs/spec/TRACEABILITY_MATRIX.md` if current reality changes implementation mapping.

Create:

- `docs/reports/00-migration-plan.md`;
- `docs/reports/00-cp0-checkpoint.md`.

The migration plan must preserve the sequence:

1. clean foundation/diagnostics;
2. design shell;
3. workout vertical slice;
4. exercise library;
5. manual programs;
6. generator/progression;
7. progress/photos/backup;
8. release hardening.

## Required evidence

- exact commands and outputs;
- current screenshots at target viewports;
- production-build smoke;
- dependency list;
- bundle report;
- network origin list;
- schema/table diagram or table;
- donor matrix;
- risks/blockers.

## CP0 exit gate

Pass only when:

- baseline is reproducible or blockers are fully evidenced;
- immutable source commits are pinned;
- all telemetry/network risks are identified;
- schema/migration risks are known;
- donor candidates are classified;
- preserve/refactor/replace plan exists;
- no product feature work was added.

Open one pull request, use the pull-request template, and stop.
