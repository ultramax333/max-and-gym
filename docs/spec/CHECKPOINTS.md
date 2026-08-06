# Construction checkpoints

A checkpoint is a known-good state. Codex must not begin the next task until the prior checkpoint report is reviewed and accepted.

## Global checkpoint gate

Every checkpoint requires:

- clean install from lockfile;
- type check;
- lint;
- relevant unit/component tests;
- production build;
- project audit;
- checkpoint report;
- no unexplained telemetry/network origin;
- updated requirement traceability;
- rollback or recovery note;
- pull request;
- Codex stops.

## CP0 — Baseline understood

### Goal

Establish exact reality before modifying architecture.

### Entry

- fresh RepQuest fork;
- specification package committed.

### Deliverables

- pinned RepQuest commit;
- pinned Workout.cool donor commit;
- environment/runtime inventory;
- build/test result;
- route and screen inventory;
- current database/schema/migration inventory;
- current PWA/service-worker/cache inventory;
- telemetry/runtime-network inventory;
- licence inventory;
- donor UI matrix;
- preserve/refactor/replace module map;
- risk register update;
- migration plan;
- baseline screenshots and bundle report.

### Exit criteria

- existing app can be installed and built reproducibly, or each blocker is documented with evidence;
- no product feature work has begun;
- data migration risks are known;
- donor candidates are classified;
- CP0 report accepted.

## CP1 — Clean foundation and diagnostics

### Goal

Create a safe engineering foundation without yet rebuilding the product.

### Deliverables

- telemetry/Sentry/Alceris removed;
- supported Node/npm pinned;
- stable lockfile;
- strict type/lint/test commands;
- continuous-integration workflow;
- GitHub Pages production build and subpath test;
- build identity;
- root/route error boundaries;
- redacted diagnostic event framework;
- project audit command;
- doctor command;
- initial Diagnostics screen;
- database/migration journal scaffolding;
- service-worker prompt-update strategy;
- no unexpected runtime origin.

### Exit criteria

- clean production build;
- GitHub Pages preview works under project subpath;
- app exposes build/schema identity;
- intentional test error produces redacted error ID;
- project audit artifact is generated;
- CP1 report accepted.

## CP2 — max&gym design shell

### Goal

Replace the visual shell and establish reusable components while preserving known data.

### Deliverables

- max&gym Material UI theme;
- dark-only design tokens;
- responsive shell;
- mobile bottom navigation;
- desktop navigation;
- Home/Train/Programs/Progress/Library route shells;
- loading/empty/error/offline states;
- foundational component catalogue;
- onboarding shell;
- Settings and Diagnostics navigation;
- visual-regression baseline;
- accessibility baseline.

### Exit criteria

- no second UI framework in production;
- mobile layouts pass target viewports;
- keyboard/focus baseline passes;
- direct donor reuse is recorded;
- CP2 report accepted.

## CP3 — Dependable workout vertical slice

### Goal

Reach the first internal gym-ready milestone.

### Deliverables

- Home shows Start/Resume;
- active workout creation;
- active-session persistence;
- exercise/set presentation;
- load/repetition/effort input;
- idempotent Complete Set;
- undo;
- rest timer from timestamps;
- background/visibility recovery;
- pause/resume;
- refresh/browser-close recovery;
- finish and summary;
- active-update deferral;
- recovery diagnostics;
- offline end-to-end flow.

### Exit criteria

- realistic workout can be completed offline;
- no duplicate set on double tap/retry;
- refresh resumes exact state;
- timer recovers accurately;
- forced test failure is diagnosable;
- service-worker update does not interrupt workout;
- CP3 report accepted.

## CP4 — Reviewed exercise library

### Goal

Provide reliable local exercise content.

### Deliverables

- pinned Free Exercise DB revision;
- curation pipeline;
- schema validation;
- reviewed initial seed set sufficient for all seed programs;
- final target 150–220 reviewed exercises;
- optimized local two-position images;
- search/filter/favourite/never-suggest;
- exercise detail;
- alternatives;
- custom exercise with one local image;
- offline media;
- curation and asset audit.

### Exit criteria

- only reviewed exercises are generator-eligible;
- seed program exercises all have complete content;
- no broken local media path;
- no duplicate/source/licence blocker;
- hard tags verified;
- CP4 report accepted.

## CP5 — Programs and manual builder

### Goal

Create and edit complete programs before automating generation.

### Deliverables

- program list/detail;
- create/edit/duplicate/archive/activate;
- two- and three-day structure;
- 40/60-minute day target;
- program exercise groups;
- reordering with accessible alternatives;
- prescriptions;
- progression-rule assignment;
- alternatives;
- lock main exercise;
- duration estimate;
- weekly balance;
- snapshot into workout sessions.

### Exit criteria

- user can manually build and run a two- or three-day program;
- completed history is unchanged after program edits;
- duration estimates calculate from full prescription;
- CP5 report accepted.

## CP6 — Deterministic generator and progression

### Goal

Automate program creation and next-session proposals.

### Deliverables

- generator input flow;
- two-day A/B;
- three-day A/B/C;
- 40/60-minute budgeting;
- 10/15-minute core generation;
- warm-up generation;
- hard constraint service;
- candidate scoring;
- stable main lifts;
- accessory regeneration;
- explanations;
- deterministic seed/version;
- progression proposals;
- accept/edit/reject/postpone;
- deload suggestion.

### Exit criteria

- all frequency/duration combinations pass;
- hard exclusions pass property tests;
- same input/seed is deterministic;
- locked exercises survive accessory regeneration;
- no progression applies silently;
- CP6 report accepted.

## CP7 — Progress, photos, and complete backup

### Goal

Finish personal history and recovery capability.

### Deliverables

- workout history;
- exercise progress and records;
- body weight/measurements;
- photo import/capture pipeline;
- local compression/thumbnails;
- comparison and blur;
- storage usage;
- `.maxgym` export;
- Replace/Merge restore;
- pre-import snapshot;
- backup reminder;
- full integrity checks;
- diagnostic export complete.

### Exit criteria

- export/clear/restore round trip returns equivalent data and photos;
- corrupt import changes nothing;
- no photo network or service-worker cache;
- diagnostic export passes sensitive-data leak tests;
- CP7 report accepted.

## CP8 — Release candidate

### Goal

Harden and publish version 1 without adding scope.

### Deliverables

- all acceptance tests;
- Android manual matrix;
- accessibility remediation;
- performance optimization;
- final offline/update tests;
- licence/provenance audit;
- recovery drill;
- user documentation;
- production GitHub Pages workflow;
- release notes;
- version tag;
- post-release verification.

### Exit criteria

- no release-blocking defect;
- all priority-zero criteria pass;
- production build identity matches release tag;
- backup and diagnostics verified on production origin;
- CP8 report accepted.
