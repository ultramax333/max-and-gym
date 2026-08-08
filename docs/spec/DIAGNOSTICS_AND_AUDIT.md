# Diagnostics and audit system

## 1. Purpose

The project must be diagnosable by someone who did not write the failing code. Every release and checkpoint must provide enough identity, state, and evidence to isolate whether a failure originates in:

- build/deployment;
- routing/base path;
- service worker/cache;
- IndexedDB schema or migration;
- workout transaction;
- timer recovery;
- generator constraints;
- media/storage;
- backup/import;
- UI rendering;
- unexpected network dependency;
- browser capability.

Diagnostics are a product feature, not a late debugging add-on.

## 2. Audit layers

### Layer A — Repository audit

Static inspection of:

- dependency graph;
- unused/duplicate dependencies;
- licences;
- forbidden server or telemetry packages;
- source boundaries;
- circular dependencies;
- direct Dexie access outside data layer;
- unsafe HTML;
- unexpected network origins;
- schema/version definitions;
- service-worker configuration;
- donor-code provenance;
- asset size and duplicates;
- dead routes/components.

### Layer B — Continuous-integration audit

Every pull request runs:

- clean dependency install;
- TypeScript check;
- lint;
- architecture rules;
- unit tests;
- component tests;
- migration tests;
- production build;
- bundle report;
- static network-origin scan;
- licence/provenance check.

Phase-specific jobs add:

- end-to-end;
- offline;
- service-worker update;
- visual regression;
- accessibility;
- backup round-trip;
- media integrity;
- generator property tests.

### Layer C — Runtime diagnostics

The application records bounded, redacted diagnostic events and exposes a Diagnostics screen.

### Layer D — Support package

The user can export a diagnostic ZIP that contains technical state but excludes personal workout data by default.

## 3. Required package scripts

Final names may adapt to the package manager, but these capabilities are mandatory:

```text
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run test
npm run test:unit
npm run test:components
npm run test:migrations
npm run test:e2e
npm run test:offline
npm run test:visual
npm run test:a11y
npm run audit:project
npm run audit:network
npm run audit:licenses
npm run audit:assets
npm run doctor
npm run quality
```

`quality` is the local checkpoint gate. It runs all checks appropriate to the current stable phase.

`doctor` produces a human-readable environment/baseline report without modifying data.

`audit:project` produces machine-readable and Markdown findings.

## 4. Build identity

Inject at build time:

- `APP_VERSION`;
- `GIT_SHA`;
- `BUILD_TIMESTAMP`;
- `BUILD_ENVIRONMENT`;
- `DATABASE_SCHEMA_VERSION`;
- `EXPORT_FORMAT_VERSION`;
- `EXERCISE_SEED_VERSION`;
- `PROGRAM_SEED_VERSION`;
- `GENERATOR_VERSION`;
- `CACHE_VERSION`.

Show this in Settings → Diagnostics and include it in all diagnostic exports and checkpoint reports.

## 5. Diagnostic event schema

Each event contains only:

- `id`;
- `timestamp`;
- `level`;
- `subsystem`;
- `code`;
- `safeMessage`;
- `buildId`;
- `databaseSchemaVersion`;
- `route`;
- `operationId`, optional;
- hashed entity identifier, optional;
- allow-listed safe context;
- resolved timestamp, optional.

Retention:

- at most 1000 events;
- at most 30 days;
- prune on insert/boot;
- user can clear diagnostic events independently.

## 6. Subsystems and error codes

Subsystems:

- `BOOT`
- `ROUTER`
- `DB`
- `MIGRATION`
- `WORKOUT`
- `TIMER`
- `GENERATOR`
- `MEDIA`
- `BACKUP`
- `IMPORT`
- `PWA`
- `CACHE`
- `STORAGE`
- `UI`
- `NETWORK`
- `LICENSE`

Initial stable codes:

### Boot and routing

- `BOOT_UNHANDLED_ERROR`
- `BOOT_DATABASE_UNAVAILABLE`
- `BOOT_ACTIVE_SESSION_RECOVERY_FAILED`
- `ROUTER_UNKNOWN_ROUTE`
- `ROUTER_BASE_PATH_MISMATCH`

### Database and migrations

- `DB_OPEN_FAILED`
- `DB_TRANSACTION_ABORTED`
- `DB_INVARIANT_VIOLATION`
- `DB_WRITE_RETRY_EXHAUSTED`
- `MIGRATION_STARTED`
- `MIGRATION_FAILED`
- `MIGRATION_POSTCHECK_FAILED`
- `MIGRATION_RECOVERY_REQUIRED`

### Workout

- `WORKOUT_ACTIVE_SESSION_CONFLICT`
- `WORKOUT_SET_SAVE_FAILED`
- `WORKOUT_DUPLICATE_SET_BLOCKED`
- `WORKOUT_UNDO_FAILED`
- `WORKOUT_FINISH_FAILED`
- `WORKOUT_RECOVERY_REPAIRED`
- `WORKOUT_RECOVERY_BLOCKED`

### Timer

- `TIMER_STATE_INVALID`
- `TIMER_OWNER_MISMATCH`
- `TIMER_SIGNAL_UNAVAILABLE`
- `TIMER_RECOVERED_FROM_TIMESTAMP`

### Generator

- `GENERATOR_INVALID_INPUT`
- `GENERATOR_NO_VALID_CANDIDATE`
- `GENERATOR_CONSTRAINT_VIOLATION`
- `GENERATOR_DURATION_OUT_OF_BOUNDS`
- `GENERATOR_NON_DETERMINISTIC_RESULT`

### Media/storage

- `MEDIA_DECODE_FAILED`
- `MEDIA_COMPRESSION_FAILED`
- `MEDIA_REFERENCE_MISSING`
- `STORAGE_PERSISTENCE_DENIED`
- `STORAGE_QUOTA_EXCEEDED`
- `STORAGE_ESTIMATE_UNAVAILABLE`

### Backup/import

- `BACKUP_PREFLIGHT_FAILED`
- `BACKUP_BUILD_FAILED`
- `BACKUP_CHECKSUM_MISMATCH`
- `IMPORT_UNSUPPORTED_VERSION`
- `IMPORT_SCHEMA_INVALID`
- `IMPORT_CHECKSUM_MISMATCH`
- `IMPORT_STORAGE_INSUFFICIENT`
- `IMPORT_TRANSACTION_ABORTED`
- `IMPORT_POSTCHECK_FAILED`

### Progressive Web App and network

- `PWA_REGISTRATION_FAILED`
- `PWA_UPDATE_AVAILABLE`
- `PWA_UPDATE_DEFERRED`
- `CACHE_VERSION_MISMATCH`
- `CACHE_CLEANUP_FAILED`
- `NETWORK_UNEXPECTED_ORIGIN`
- `ANDROID_UPDATE_CHECK_FAILED`
- `ANDROID_UPDATE_DEFERRED`
- `ANDROID_UPDATE_LAUNCH_FAILED`

### UI

- `UI_ROUTE_RENDER_FAILED`
- `UI_FEATURE_BOUNDARY_FAILED`
- `UI_CHART_RENDER_FAILED`

Codes are append-only once released. Do not change their meaning silently.

## 7. Redaction policy

Never include in diagnostic events, console output, or diagnostic export:

- workout notes;
- exercise notes;
- progress-photo data or filenames;
- body measurements;
- actual loads;
- actual repetitions;
- effort values;
- discomfort descriptions;
- custom exercise names;
- personal file paths;
- raw archive contents;
- full browser storage contents.

Safe context examples:

- record count;
- boolean capability;
- schema number;
- route identifier;
- error class;
- byte size;
- elapsed milliseconds;
- expected/actual version;
- anonymized hash;
- check status.

A central redaction function must be tested.

## 8. Diagnostics screen

### Build card

- app version;
- Git SHA;
- build time;
- database/export/seed/generator/cache versions.

### Database card

- database open state;
- schema version;
- table count;
- latest migration;
- latest integrity check;
- active-workout count;
- safe record counts.

### Progressive Web App card

- service-worker registration;
- controlling worker;
- update waiting;
- cache version;
- offline-ready status;
- install/display status.

### Storage card

- persistence granted/best effort;
- usage;
- quota;
- photo/media usage;
- warning threshold.

### Capability card

- wake lock;
- vibration;
- notifications;
- audio unlocked;
- WebP;
- storage estimate;
- share/download support.

### Workout recovery card

- active session exists;
- status;
- timer exists;
- integrity status;
- no loads, repetitions, notes, or exercise names.

### Error card

- recent errors by code/subsystem;
- timestamp;
- error identifier;
- safe message;
- copy error ID.

### Actions

- Run self-test.
- Export diagnostics.
- Clear diagnostic events.
- Recheck service worker.
- Request persistent storage.
- Open backup screen.

## 9. Non-destructive self-test

The self-test never edits real user records.

Checks:

1. open database;
2. temporary test-store write/read/delete;
3. required table/index presence;
4. referential integrity;
5. maximum one active session;
6. unique critical operation identifiers;
7. active timer ownership;
8. photo/blob references;
9. program/exercise references;
10. seed version consistency;
11. service-worker registration;
12. expected cache names;
13. no user media in service-worker cache;
14. storage estimate;
15. personal-backup dry run without emitting media bytes;
16. generator sample respecting all hard exclusions;
17. deterministic generator sample;
18. unexpected network-origin list;
19. licence/provenance completeness;
20. build identity completeness.

Result levels:

- pass;
- warning;
- fail;
- unavailable.

A warning does not block use unless a checkpoint defines otherwise.

## 10. Diagnostic export

File: `max-and-gym-diagnostics-<timestamp>.zip`

Contents:

```text
manifest.json
build.json
environment.json
database-health.json
pwa-health.json
storage-health.json
capabilities.json
self-test.json
diagnostic-events.json
network-origins.json
feature-status.json
README.txt
```

Excluded by default:

- data records;
- photos;
- notes;
- names;
- loads;
- repetitions;
- measurements;
- full user agent when an abbreviated browser/platform value is enough.

Before download, show the exact category list.

## 11. Project audit report

`npm run audit:project` writes:

```text
artifacts/audit/project-audit.json
artifacts/audit/project-audit.md
```

Sections:

- build identity;
- package/runtime versions;
- dependency risks;
- architecture-boundary violations;
- route inventory;
- database versions/migrations;
- service-worker/cache policy;
- runtime origin allowlist;
- telemetry scan;
- donor provenance;
- licence scan;
- asset report;
- test inventory;
- open known risks;
- checkpoint readiness.

Findings use:

- identifier;
- severity;
- subsystem;
- evidence;
- likely cause;
- affected requirement;
- recommended action;
- blocking checkpoint.

## 12. Checkpoint audit

Before a checkpoint is accepted:

1. run `quality`;
2. run `audit:project`;
3. run phase-specific tests;
4. inspect generated report;
5. compare with prior checkpoint;
6. ensure no new unexplained origin, dependency, schema, or bundle regression;
7. attach report/artifacts to the pull request;
8. write checkpoint report;
9. create a checkpoint tag after merge.

## 13. Error isolation protocol

When a bug appears:

1. capture app version, Git SHA, error ID, route, and reproduction steps;
2. export diagnostics;
3. reproduce in a clean browser profile;
4. reproduce with service worker disabled to separate cache from code;
5. inspect diagnostic subsystem/code;
6. compare against last known checkpoint tag;
7. create a failing automated test;
8. use `git bisect` when the failure is deterministic and regression range is known;
9. apply the smallest fix;
10. run full affected checkpoint gate;
11. update `docs/spec/KNOWN_FAILURE_MODES.md` when the class is new.

Do not “fix” unexplained data failures by clearing the database.

## 14. Privacy verification

The network audit must inspect a representative flow:

- initial load;
- onboarding;
- exercise view;
- workout;
- progress;
- photo add;
- backup;
- diagnostics.

Any request outside allowed same-origin assets fails the audit unless explicitly documented and approved.
