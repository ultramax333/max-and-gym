# Sequenced implementation backlog

This backlog is intentionally ordered. Do not pull work forward without a checkpoint decision.

## Requirement prefixes

- `FND` — foundation
- `UI` — interface
- `WKT` — active workout
- `EXR` — exercises
- `PRG` — programs
- `GEN` — generator/progression
- `PRO` — progress/body/photos
- `BKP` — backup/import
- `DIA` — diagnostics/audit
- `PWA` — Progressive Web App/offline
- `SEC` — privacy/security/licences

## Task 00 — Audit base and donor → CP0

- `FND-001` Pin RepQuest commit and baseline environment.
- `FND-002` Inventory routes, modules, dependencies, tests, build.
- `FND-003` Inventory Dexie schema and data flows.
- `PWA-001` Inventory manifest, service worker, cache, deployment.
- `SEC-001` Inventory Sentry, Alceris, telemetry, runtime origins.
- `SEC-002` Inventory licences.
- `UI-001` Audit Workout.cool UI donor at pinned commit.
- `UI-002` Classify donor patterns A/B/C/D.
- `DIA-001` Create baseline audit and risk reports.
- `FND-004` Produce preserve/refactor/replace map.
- `FND-005` Produce migration plan.

## Task 01 — Stabilize and diagnostics → CP1

- `FND-010` Pin supported Node/npm and lockfile.
- `FND-011` Establish strict type/lint/test/build scripts.
- `FND-012` Establish pull-request continuous integration.
- `SEC-010` Remove telemetry, Sentry, Alceris, remote scripts/fonts.
- `SEC-011` Add runtime-origin policy test.
- `PWA-010` Configure static subpath build and route smoke test.
- `PWA-011` Configure prompt-based service-worker updates.
- `DIA-010` Add build identity.
- `DIA-011` Add stable error-code framework and redaction.
- `DIA-012` Add diagnostic event storage/retention.
- `DIA-013` Add root/route boundaries.
- `DIA-014` Add `doctor` and `audit:project`.
- `DIA-015` Add initial Diagnostics screen.
- `DIA-016` Add migration/operation journal foundation.

## Task 02 — Design system and shell → CP2

- `UI-010` Implement max&gym Material UI tokens/theme.
- `UI-011` Implement responsive AppShell.
- `UI-012` Implement five-item mobile navigation.
- `UI-013` Implement desktop navigation.
- `UI-014` Implement core action/input/state components.
- `UI-015` Implement route shells.
- `UI-016` Implement onboarding and Settings shells.
- `UI-017` Add loading/empty/error/offline states.
- `UI-018` Establish visual-regression baseline.
- `UI-019` Establish accessibility baseline.
- `UI-020` Record any donor-code adaptation.

## Task 03 — Workout vertical slice → CP3

- `WKT-001` Define workout repository/application-service boundary.
- `WKT-002` Create/resume active session transactionally.
- `WKT-003` Render current exercise and sets.
- `WKT-004` Enter actual load, repetitions, effort.
- `WKT-005` Complete set idempotently.
- `WKT-006` Undo recent set action.
- `WKT-007` Persist/restore active position.
- `WKT-008` Implement timestamp rest timer.
- `WKT-009` Add sound/vibration best-effort feedback.
- `WKT-010` Add wake lock progressive enhancement.
- `WKT-011` Pause/resume workout.
- `WKT-012` Finish and summarize session.
- `WKT-013` Add refresh/browser-close recovery.
- `WKT-014` Add workout error boundary and recovery diagnostics.
- `PWA-020` Defer update while workout active.
- `PWA-021` Offline workout end-to-end test.

## Task 04 — Exercise library → CP4

- `EXR-001` Pin upstream dataset revision.
- `EXR-002` Define exercise/metadata/media schema.
- `EXR-003` Build allowlist/override curation pipeline.
- `EXR-004` Validate/dedupe/tag content.
- `EXR-005` Process thumbnails/detail images.
- `EXR-006` Build reviewed seed subset for seed programs.
- `EXR-007` Expand to 150–220 reviewed exercises.
- `EXR-008` Search and filters.
- `EXR-009` Exercise detail.
- `EXR-010` Favourite and Never Suggest.
- `EXR-011` Alternatives.
- `EXR-012` Custom exercise and one local image.
- `EXR-013` Offline media/cache rules.
- `EXR-014` Curation, source, licence, and asset audit.

## Task 05 — Programs and builder → CP5

- `PRG-001` Program repository/entities.
- `PRG-002` List/detail/status.
- `PRG-003` Manual create/edit.
- `PRG-004` Day and exercise reordering.
- `PRG-005` Superset/triset/circuit groups.
- `PRG-006` Prescriptions.
- `PRG-007` Progression-rule assignment.
- `PRG-008` Alternatives and locked main exercise.
- `PRG-009` Duration estimator.
- `PRG-010` Weekly movement/muscle balance.
- `PRG-011` Duplicate/archive/activate.
- `PRG-012` Immutable session snapshots.
- `PRG-013` Accessible non-drag reorder controls.

## Task 06 — Generator and progression → CP6

- `GEN-001` Input normalization.
- `GEN-002` Shared hard-constraint service.
- `GEN-003` Candidate scoring.
- `GEN-004` Two-day structure.
- `GEN-005` Three-day structure.
- `GEN-006` 40/60-minute time budget.
- `GEN-007` 10/15-minute core generator.
- `GEN-008` Warm-up generator.
- `GEN-009` Stable main exercises.
- `GEN-010` Regenerate accessories only.
- `GEN-011` Generator explanation snapshot.
- `GEN-012` Determinism and versioning.
- `GEN-013` Double progression.
- `GEN-014` Fixed increment and top/back-off.
- `GEN-015` Conditioning progression.
- `GEN-016` Deload review proposal.
- `GEN-017` Accept/edit/reject/postpone.
- `GEN-018` Property and duration tests.

## Task 07 — Progress, photos, backup → CP7

- `PRO-001` Workout history.
- `PRO-002` Exercise progress/records/estimated max.
- `PRO-003` Frequency/duration/volume summaries.
- `PRO-004` Body weight and measurements.
- `PRO-005` Photo input.
- `PRO-006` Orientation/re-encoding/compression.
- `PRO-007` Thumbnail/blur/comparison.
- `PRO-008` Media storage/cleanup.
- `BKP-001` Personal backup manifest and ZIP.
- `BKP-002` Checksums and preflight.
- `BKP-003` Replace import.
- `BKP-004` Merge import.
- `BKP-005` Pre-import snapshot and rollback.
- `BKP-006` Backup reminder and storage report.
- `DIA-020` Complete self-test.
- `DIA-021` Complete redacted diagnostic export.
- `DIA-022` Sensitive-data leak tests.

## Task 08 — Hardening and release → CP8

- `FND-090` Full acceptance suite.
- `PWA-090` Install/offline/update production test.
- `UI-090` Accessibility remediation.
- `UI-091` Visual regression review.
- `FND-091` Performance/bundle optimization.
- `SEC-090` Network/privacy audit.
- `SEC-091` Licence/provenance audit.
- `BKP-090` Backup recovery drill.
- `DIA-090` Audit comparison against CP0.
- `FND-092` User documentation.
- `FND-093` Release notes/tag/deployment.
- `FND-094` Post-release smoke and rollback verification.

## Deferred backlog

- light theme;
- custom exercise video;
- encrypted backup;
- automatic cloud backup;
- Health Connect;
- wearable integration;
- additional languages;
- alternate split templates;
- camera-based analysis;
- remote/artificial-intelligence coaching.
