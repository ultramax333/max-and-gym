# Technical architecture

## 1. Architecture goals

The architecture must optimize for:

- local-first reliability;
- static GitHub Pages deployment;
- fast set logging;
- safe schema evolution;
- deterministic generation;
- offline operation;
- traceable failures;
- incremental migration from RepQuest;
- clear separation between UI, domain, and persistence.

## 2. Technology baseline

Retain from RepQuest when the Task 00 audit confirms compatibility:

- React;
- TypeScript in strict mode;
- Vite;
- Material UI;
- Dexie over IndexedDB;
- npm and the existing lockfile, unless the audit justifies a controlled package-manager change;
- GitHub Actions.

Add or standardize:

- a maintained Vite Progressive Web App plugin and Workbox;
- React Router with hash routing, or the existing equivalent if static-subpath behavior is proven;
- Vitest;
- Testing Library;
- Playwright;
- automated accessibility checks;
- schema validation such as Zod at external-data boundaries;
- bundle analysis;
- dependency and architecture checks.

Do not replace the stack during feature development merely for preference.

## 3. Target source structure

The final exact paths may adapt to the existing code, but dependency direction must follow this model:

```text
src/
  app/
    bootstrap/
    routing/
    providers/
    shell/
    error-boundaries/
  domain/
    exercise/
    program/
    workout/
    progression/
    body/
    backup/
    diagnostics/
  data/
    db/
    migrations/
    repositories/
    seed/
    media/
    backup/
  features/
    onboarding/
    home/
    active-workout/
    exercise-library/
    program-builder/
    program-generator/
    progress/
    body-tracking/
    settings/
    diagnostics/
  shared/
    ui/
    hooks/
    lib/
    types/
    constants/
    test/
  content/
    exercises/
    programs/
    licences/
```

## 4. Dependency direction

Allowed direction:

```text
shared ← domain ← data/application ← features ← app
```

Rules:

- `domain` does not import React, Material UI, Dexie, or browser UI APIs.
- `features` do not access Dexie tables directly.
- `data` implements domain repository interfaces.
- `app` composes providers, routes, and global boundaries.
- shared UI has no workout-specific persistence logic.
- no circular feature dependencies.

Enforce with an architecture test or dependency-cruiser-equivalent after Checkpoint 1.

## 5. Application services and repositories

Required conceptual interfaces:

- `ExerciseRepository`
- `ProgramRepository`
- `WorkoutRepository`
- `BodyRepository`
- `MediaRepository`
- `DiagnosticsRepository`
- `SettingsRepository`
- `BackupService`
- `GeneratorService`
- `ProgressionService`
- `IntegrityService`

UI calls application services/hooks. Application services coordinate domain rules and repositories.

## 6. State model

### Persistent state

IndexedDB:

- user profile and settings;
- equipment and constraints;
- exercises and media;
- programs and prescriptions;
- active and completed workouts;
- logged sets and timers;
- body measurements and photos;
- progression proposals;
- diagnostic events;
- migration/import/export journals;
- backup metadata.

### Ephemeral state

React state:

- open sheets and dialogs;
- filter controls;
- temporary form edits before save;
- selected chart range;
- animation state;
- current presentation of a persisted timer.

The active workout is never solely ephemeral.

### Global state

Do not add a global state library by default. Use:

- route state;
- feature-local state;
- React context only for truly cross-cutting concerns;
- observable/live Dexie queries for persistent state;
- application services for coordination.

If a global state library becomes necessary, create an Architecture Decision Record with measured evidence.

## 7. Database design

### Versioning

Maintain independent versions for:

- `DATABASE_SCHEMA_VERSION`;
- `EXPORT_FORMAT_VERSION`;
- `EXERCISE_SEED_VERSION`;
- `CACHE_VERSION`;
- `GENERATOR_VERSION`.

### Migrations

Every migration:

1. has a named version;
2. has anonymous prior-version fixtures;
3. is unit/integration tested;
4. is idempotent at the application level;
5. records start, success, or failure in a migration journal;
6. never deletes the database as a shortcut;
7. validates essential record counts and relationships after completion;
8. exposes a recovery path.

### Transactions

Use transactions for:

- completing a set and advancing session position;
- creating/finishing a workout;
- changing a program with linked entities;
- saving/removing a photo and thumbnail;
- import commit;
- migration batches;
- accepting progression proposals.

## 8. Critical operation idempotency

Critical writes use a unique operation identifier, normally `crypto.randomUUID()`:

- set completion;
- undo;
- workout finish;
- progression acceptance;
- import;
- migration;
- photo save/delete.

A duplicate operation identifier must return the original successful result rather than write again.

## 9. Boot sequence

1. Load static shell.
2. Create build identity.
3. Register global error handlers.
4. Open database.
5. Run required migrations.
6. Validate minimum schema.
7. Load settings and active-session header.
8. Register service worker.
9. Resolve route.
10. Show Home/Resume or recovery screen.
11. Run lightweight non-blocking health checks.

A database failure must not render a blank screen. Show a recovery boundary with Diagnostics and Export options where possible.

## 10. Routing and GitHub Pages

Use hash routing by default:

```text
https://<user>.github.io/max-and-gym/#/home
```

Reasons:

- reliable direct navigation on project-level GitHub Pages;
- no custom server fallback;
- fewer 404 and base-path edge cases.

All asset paths use Vite’s base configuration. Tests deploy the production build under a non-root subpath.

## 11. Progressive Web App architecture

Required:

- valid manifest;
- standalone display;
- maskable and regular icons;
- offline shell;
- versioned precache;
- lazy runtime cache for non-sensitive seed exercise media;
- no cache for progress photos or user media;
- update prompt;
- update deferred while active workout exists;
- cache-cleanup policy;
- offline fallback;
- visible app/build version.

Use prompt behavior rather than unconditional auto-reload.

## 12. Timer architecture

Persist:

- timer identifier;
- owning workout;
- type;
- `startedAt`;
- `endsAt`;
- paused state;
- remaining duration at pause;
- status.

The UI computes:

```text
remaining = max(0, endsAt - currentTime)
```

Do not trust interval tick counts. Reconcile on visibility change, focus, resume, and boot.

Audio and vibration:

- unlocked after explicit user interaction;
- feature-detected;
- best-effort;
- failure does not affect timer correctness.

## 13. Media architecture

### Seed exercise media

- optimized static assets;
- locally bundled or generated into the application build;
- small thumbnails;
- lazy full images;
- licence/source metadata;
- integrity checks;
- service-worker caching allowed.

### User media

- selected locally;
- decoded and re-encoded;
- orientation corrected where possible;
- maximum dimension initially 1600 pixels;
- WebP preferred, JPEG fallback;
- thumbnail generated;
- Blob stored in IndexedDB;
- never placed in service-worker runtime caches;
- temporary object URLs revoked;
- included in personal backup only.

## 14. Backup architecture

`.maxgym` is a ZIP container:

```text
manifest.json
data.json
media/photos/<id>.<ext>
media/custom-exercises/<id>.<ext>
checksums.json
```

Export:

1. run integrity preflight;
2. snapshot consistent data;
3. stream/build archive;
4. calculate checksums;
5. validate archive;
6. download;
7. record backup metadata.

Import:

1. parse manifest;
2. reject unsupported format;
3. validate paths and size limits;
4. validate checksums;
5. validate data schema;
6. estimate storage;
7. show preview;
8. create safety snapshot;
9. stage or transactionally import;
10. run integrity checks;
11. commit or rollback.

## 15. Diagnostic architecture

### Event log

Store a bounded ring of redacted diagnostic events in IndexedDB:

- maximum 1000 events;
- maximum age 30 days;
- level;
- subsystem;
- stable error code;
- safe message;
- timestamp;
- build identifier;
- database schema;
- route;
- operation identifier;
- hashed entity identifier when needed;
- allow-listed safe context.

### Error boundaries

At minimum:

- root boot boundary;
- route boundary;
- active-workout boundary;
- media boundary;
- chart boundary.

Each displays a stable error identifier and a path to Diagnostics.

### Self-test

A non-destructive self-test validates:

- temporary database read/write/delete;
- expected tables and indexes;
- referential integrity;
- at most one active workout;
- timer ownership;
- media references;
- seed version;
- service-worker/cache state;
- backup dry run;
- storage quota;
- hard-exclusion sample generation.

## 16. Build identity

Expose and include in diagnostic exports:

- semantic application version;
- Git commit SHA;
- build timestamp;
- environment;
- database version;
- export version;
- seed version;
- generator version;
- cache version.

## 17. Runtime network policy

Core production use must require no third-party origin.

Allowed by default:

- same-origin application assets;
- same-origin GitHub Pages navigation;
- explicit user-triggered navigation to source/licence pages, outside core operation.

Automated tests fail on unexpected runtime origins.

## 18. Performance budgets

Initial targets:

- no full-resolution exercise library in the initial JavaScript bundle;
- route-level and media lazy loading;
- active-workout JavaScript available in the core offline shell;
- compressed seed images;
- no duplicate UI framework;
- production bundle report at each checkpoint;
- logging a set gives visual feedback within one animation frame and persists without blocking the interface.

Exact byte budgets are set after Task 00 baseline measurement.

## 19. Browser capabilities

Feature-detect:

- wake lock;
- vibration;
- notifications;
- persistent storage;
- share/download APIs;
- WebP encoding;
- storage estimation.

No capability may be a hard requirement for completing a workout.

## 20. Security

- no secrets;
- no `dangerouslySetInnerHTML` for user content;
- sanitize imported source text;
- reject unsafe archive paths;
- cap archive and image sizes;
- no production console logs containing personal data;
- content security policy where compatible;
- dependencies audited;
- no untrusted remote scripts or fonts.
