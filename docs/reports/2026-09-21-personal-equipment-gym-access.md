# Checkpoint — personal equipment and gym access planning

Date: 2026-09-21

Tasks: Task 04 exercise catalogue / Task 06 session generation

Generator target: `deterministic-v14`

## Requirements and behavior

Previously, equipment came only from the reviewed catalogue, an exercise had no user-selected grouping station, and generation did not account for locally difficult machines or gym occupancy.

The target behavior is:

- allow one or several required equipment stations per exercise;
- choose one required station as the primary grouping station;
- let the owner mark access as normal, limited or difficult and record one or two simultaneously occupied stations;
- locally remember the preferred NonStop Gym (Lausanne Tunnel, Lausanne Gare or Flon);
- use separate historical occupancy bands for each club, with explicit quiet/busy overrides;
- deprioritize access-constrained candidates during moderate or busy periods without silently making them impossible to select;
- snapshot equipment metadata into an active workout and preserve deterministic replay.

## Changed surfaces

- `src/gym/occupancy.ts` and `src/gym/GymPreferenceRepository.ts`: local club profiles and persisted preference.
- `src/exerciseCatalog/*`: additive personal equipment/access preference model and repository operations.
- `src/pages/library/LibraryPages.tsx`: equipment and access editor with catalogue-default restore.
- `src/workout/equipmentStations.ts` and `src/components/ui/EquipmentBadge.tsx`: multi-station resolution, explicit primary grouping and badges.
- `src/generator/*` and `src/pages/programs/GeneratorPage.tsx`: v14 context, access-aware ranking and generator controls.
- workout snapshot, setup, active-workout and substitution paths: carry the selected metadata consistently.
- data-model and generator specifications: document the new invariants and limitations.

## Data, schema, export and cache

- No IndexedDB schema or index migration.
- New exercise preference fields are additive fields in the existing exercise-preference records.
- Gym selection and override use the existing `appMeta` backup surface.
- Existing backup/export traversal already includes both stores; no export version change is required.
- Session equipment fields are additive snapshots for historical consistency.
- No cache-format change and no remote data dependency.

## Verification evidence

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — pass.
- Targeted ESLint over all changed source directories/files with `--max-warnings 0` — pass.
- Unit/component suite: `node scripts/run-tests.mjs` — 58 files, 275 tests passed.
- Production build: `node scripts/build.mjs` — pass.
- Bundle report: `node scripts/bundle-report.mjs` — pass; existing large-chunk advisory remains.
- GitHub Pages smoke: `node scripts/smoke-pages.mjs` — pass.
- Project audit: `node scripts/audit-project.mjs` — required checks pass; the pre-existing staged direct-database-access warning remains (40 legacy files).
- Diff whitespace check over the scoped files — pass (line-ending notices only).

## Accessibility, performance and network

- The editor uses labelled Material UI form controls and retains mobile-sized actions.
- All occupancy evaluation is synchronous local data; generation adds only bounded candidate scoring.
- No location permission, user account, live tracking or runtime network request was added.
- The profiles are broad historical planning bands derived from the official club occupancy charts, not a promise of current availability.

Official references:

- https://www.nonstopgym.com/occupancy/
- https://www.nonstopgym.com/nos-clubs/tunnel/
- https://www.nonstopgym.com/our-clubs/flon/
- https://www.nonstopgym.com/unsere-clubs/lausanne-gare/

## Known limitations

- Occupancy is not live. Holidays, exceptional traffic and current conditions require the manual quiet/busy override.
- Access difficulty is a ranking signal, not a hard exclusion. A constrained exercise may remain when needed for a coherent session, and the preview explains this.
- The existing bundle-size advisory and legacy direct-Dexie audit warning are outside this checkpoint.

## Rollback

Revert this checkpoint commit. Additive preference fields and `appMeta` content can remain unread safely after rollback; no destructive database rollback is required. Existing workout history remains valid because the new snapshot fields are optional.

## Provenance

No donor source code, third-party asset or new dependency was added.
