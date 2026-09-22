# Application audit fixes and targeted component improvements

## Authorization, plan and scope

Task 90, MODE=FIX: owner replied “go fais le” after the root-cause report
`2026-09-22-app-audit-root-cause.md`. Continue PR #30 on
`feat/personal-equipment-gym-access-v1.12.0`; no merge or publication in this checkpoint.

Plan: fix F1–F6; share the equipment editor and local photos; expose gym access;
protect saves and asynchronous reads; verify synthetic storage and mobile flows.
Exclude new exercise content, native alarm/installer redesign and personal data.
No agents, imported donor code, new dependency, destructive data operation or
schema migration is needed.

## Requirement and implementation trace

- **F1 / FM-03 / PWA:** prompt-mode worker with skipWaiting disabled. Registration
  does not install a controllerchange reload handler. Applying instructions first
  checks persisted active/paused sessions and critical writes. Installation waits
  for all controlled tabs to close naturally, so a different tab cannot discard
  a draft. The next launch recovers saved workout data. Android's bundled app is
  excluded from web-worker registration. This deliberately replaces immediate
  in-page activation with save/close/reopen instructions for web users.
- **F2 / catalogue filtering:** one pure effectiveEquipmentTags resolver honors
  corrected resistance equipment for eligibility, alternatives, library search,
  filters and new generated/session snapshots. Auxiliary supports alone retain
  original resistance; selecting Bodyweight explicitly changes the resistance
  requirement. Source catalogue tags are preserved. Multiple resistance items
  are cumulative requirements, not interchangeable choices.
- **F3 / local media:** displayExerciseMedia and ExercisePhotos share reviewed
  frames and custom Blob photos across cards, detail, generated previews,
  alternatives and active/upcoming exercises. Each object URL is revoked by its
  owning component. Full-screen touch enlargement, image-error and empty states;
  no nested photo button inside library-card navigation.
- **F4 / saves:** reusable EquipmentEditorDialog protects double taps, disables
  controls during save/restore, reports failure and supports retry. Preferences
  update transactionally without discarding concurrent favourite/block changes.
  Active and upcoming exercises expose the same editor; confirmation explicitly
  states that current order and completed sets are unchanged. New preferences
  affect future sessions and alternatives. Stable redacted diagnostic codes.
- **F5 / identity:** build identity re-exports the domain's deterministic-v14;
  UI, backup manifests and diagnostic identity now agree. E2E imports the same
  constant instead of maintaining a second literal.
- **F6 / delivery checks:** primary badge icon is decorative with a stable text
  and accessible grouping label. Language auditing permits only the known street
  name in the specific occupancy file. Licence auditing resolves exact locked
  versions under npm or pnpm, retaining failure for genuinely unknown licences.
  Doctor derives schema/update policy from source. Lint covers src/gym.
- **UI:** gym and occupancy appear beside Generate. Automatic occupancy is
  explicitly a local estimate, not live attendance. Manual observations are
  scoped to the current generator visit. Save/read failures are actionable.
  Library search is debounced and ignores obsolete reads; detail loading/error/
  missing states are separate. No global redesign.

## Data, versions, compatibility

App package remains 1.11.4 on this feature branch, not a new release tag.
Database 8, export 2, exercise seed reviewed-8 and cache 9 are unchanged.
Generator v14 was already declared by this pending feature; identity now matches.
No existing history, session ordering, loads, photos or backups are migrated.
Native APK installation and alarms remain unmodified.

## Verification evidence

All tests use fresh browser profiles or fake IndexedDB with synthetic data.
The four diagnostic regression assertions first failed before the fixes; now
they pass inside the normal suite, alongside support/resistance edge cases.

- First full browser matrix: **38/38 passed**, including 360×800, 412×915,
  desktop visual checks, offline recovery and a real waiting-worker update.
- First full unit suite under simultaneous browser/build load: 281 passed,
  3 timing failures (5-second diagnostic timeout / 1-second home query timeout).
  The same two files then passed unchanged in isolation (3/3), alongside the
  three new update-safety component cases (6/6 total).
- Targeted editor and Blob lifecycle component tests: **4/4 passed**.
- Initial TypeScript, lint, production build, Pages smoke, project, language,
  licences, network, architecture, accessibility, performance, Android-release,
  dependency, exercise assets and general asset checks passed.
- Final full-suite/browser rerun after the last changes: recorded below.

Commands (Node 24.19.0 runtime; npm launcher is not in local PATH):

```text
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js <exact package.json lint arguments>
node scripts/run-tests.mjs
node scripts/build.mjs
node scripts/bundle-report.mjs
node scripts/smoke-pages.mjs
node scripts/doctor.mjs
node scripts/audit-{project,language,licenses,network,architecture,accessibility,performance,android-release,dependencies,exercise-assets,assets}.mjs
node artifacts/incidents/2026-09-22-app-audit/run-browser-matrix.mjs
```

The last command uses a separately managed Vite preview on port 4187 to avoid
the existing Windows Playwright web-server teardown hang. Its tests themselves
are committed under tests/. Production worker regression serves an isolated
localhost origin with changed worker response bytes; build files are untouched.

Screenshots: audit artifact browser-results directory, including generator,
active/rest workout, desktop, active equipment editor and enlarged photo.
Static contrast checks: primary 16.41:1, secondary 8.56:1, action 13.28:1;
48px controls, focus and reduced motion checks pass. Browser overflow and
semantic checks cover both mobile viewports. Network checks allow only the
production origin during representative use.

## Limits and rollback

- No physical Pixel was available: browser emulation does not certify native
  alarms, Android back, APK installation or device-specific display settings.
- Occupancy remains a local schedule estimate; no new live data source.
- No new APK/release is published by this checkpoint; existing PR must complete
  its required checks, then receive the owner's fresh approval before merging.
- Unrelated existing artifacts, source changes and APK/ZIP files are preserved
  and excluded from the commit.
- Roll back only this correction commit if needed; no IndexedDB deletion or
  down-migration. Do not restore unsafe forced web-update behavior as a routine
  workaround. Export a personal backup before any later release intervention.

## Final verification

- Final full unit/component/migration suite: **62 files, 287 tests passed** (165.45 s), without changing the failing tests or raising their timeouts.
- Final TypeScript and exact lint command: passed.
- Final production build and all 13 delivery/audit commands above: passed.
- Final Chromium matrix: **40/40 passed** (1.2 min), including failed-write retry, active-session equipment editing, photo enlargement with the numeric draft preserved, multi-tab waiting worker, offline and process-style recovery.
- Visual inspection found tightly packed fields in the new shared editor; a final spacing-only adjustment was rebuilt and the focused browser test passed on both viewports (**2/2**, 5.9 s).
- PR check results are read from GitHub after the scoped correction commit is pushed; no merge is performed here.
