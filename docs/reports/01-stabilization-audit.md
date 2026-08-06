# Task 01 stabilization audit

Date: 2026-08-06

Branch: `task/01-stabilize-diagnostics`

Baseline: `2c85542053f8488ed6c9992ee71762b3c51995a2`

## Outcome

The RepQuest foundation is now a static, local-first Max & Gym build with local diagnostics, explicit PWA updates, stable build identity and checkpoint automation. The existing `weightlog` database remains at schema version 3. Diagnostics use a separate `max-and-gym-diagnostics` IndexedDB database at version 1.

## Runtime and build

- Node 24 and npm 11 are pinned through `.nvmrc` and `engines`.
- `package-lock.json` is the only lockfile.
- Strict TypeScript, scoped zero-warning lint, Vitest, build, doctor and audit commands are wired into `quality`.
- CI uses `npm ci` and fails on every quality step; the previous hidden `|| true` build failure is removed.
- GitHub Pages base is `/max-and-gym/`; the production smoke validates asset and manifest paths.
- Production output: 111 files, 6,456,260 bytes; main JS 1,568,929 bytes (470.26 kB gzip); exercise data 846,982 bytes (159.89 kB gzip).

## Privacy and runtime origins

- Removed Sentry, Alceris, Supabase and the telemetry settings route.
- Removed automatic remote exercise images and the remote EOL image.
- YouTube is now an explicit external navigation instead of an embedded runtime request.
- Exercise images render only from same-origin, `blob:` or `data:image/` sources.
- Production console arguments are suppressed and replaced by a fixed safe message.
- Static runtime audit allowlist is same-origin only; zero forbidden runtime references were found.

## Diagnostics

- Append-only registry: 53 stable error codes across 16 subsystems.
- Central context allowlist and text redaction.
- Maximum 1,000 events and 30-day retention, pruned on insert/read.
- Global error/rejection capture plus root and route boundaries.
- Separate event, operation, migration and temporary self-test stores.
- Diagnostics screen shows build, database/schema, PWA/cache, storage, self-test and recent error IDs.
- Induced route error produced a UUID and `UI_ROUTE_RENDER_FAILED`; the injected secret was absent from the interface and IndexedDB event.

## PWA

- `registerType: 'prompt'`; no automatic reload.
- Waiting, registered, controlling and offline-ready states are visible.
- Apply is deferred if an active workout timestamp exists or active state cannot be verified.
- Cache ID is versioned, outdated caches are cleaned, runtime caching is empty and no user media is cached.

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | pass |
| Lint | pass, zero warnings in CP1-owned code |
| Unit/component/migration tests | 12 pass across 7 files |
| Existing database v3 open | pass |
| Redaction fixtures | pass |
| Event retention bounds | pass |
| Forbidden-origin detector fixture | pass |
| Prompt PWA configuration | pass |
| `doctor` | ready |
| `audit:project` | pass; legacy direct Dexie access retained as a documented warning |
| `audit:network` | pass; zero forbidden runtime references |
| `audit:licenses` | pass; no restricted dependency licence |
| Production build | pass |
| GitHub Pages subpath smoke | pass |
| Browser self-test | 6/6 pass on the implemented CP1 subset |

## Residual findings

- The legacy domain still accesses Dexie directly; repository extraction belongs to Tasks 03–07.
- The main and exercise-data chunks remain oversized.
- Dependency audit still reports 23 known vulnerabilities including one critical transitive finding; forced upgrades were not applied.
- Full dynamic request interception, offline E2E, accessibility and visual regression suites activate at their owning later checkpoints. CP1 used a production-browser flow plus the static origin gate.
- React Router v7 future-flag warnings remain non-blocking.
