# CP8 full acceptance report

Date: 2026-08-07  
Branch: `task/08-offline-hardening-release`  
Base: `64ee66b23a1e` (accepted CP7)  
Candidate: Max & Gym `1.0.0`, database `8`, export `2`, cache `2`

## Decision

The local release candidate passes type checking, zero-warning lint, 82 unit/component/domain/migration tests, 12 Chromium release scenarios, production build, GitHub Pages subpath smoke and every reproducible static audit. It is **not yet CP8-accepted or production-released**: physical Android verification, deployed old-cache update, production SHA/tag identity and production smoke require the external GitHub/phone environment.

Status key: **Pass** = locally executed; **Simulated** = deterministic browser/device/capability fixture; **Pending external** = cannot be truthfully completed in this workspace.

## Acceptance matrix

| ID | Status | Evidence / limitation |
|---|---|---|
| AT-A01 | Pass locally | Node 24 typecheck, lint, tests and production build pass; clean-checkout CI is defined but not run locally. |
| AT-A02 | Pass | `smoke-pages.mjs` and Chromium load `/max-and-gym/` hash routes. |
| AT-A03 | Pass locally | Diagnostics displayed `1.0.0`, SHA, build time, DB/export/seed/generator/cache identity. Production tag parity pending. |
| AT-B01 | Pass | Browser origin capture contained only `http://127.0.0.1:4173`; static network audit passed. |
| AT-B02 | Pass | Photo pipeline/cache exclusion tests and CP7 browser drill; no runtime upload route. |
| AT-B03 | Pass | Sensitive-fixture diagnostic redaction tests pass. |
| AT-C01 | Pending external | Manifest/icons/build valid; actual Android install must be performed on the production origin. |
| AT-C02 | Pass in Chromium | First-load install, control reload, active-workout and Diagnostics offline reopens pass; precache contains shell/routes/media. |
| AT-C03 | Simulated pass | Waiting-update deferral while active is covered by PWA/workout tests; real deployed two-build phone path pending. |
| AT-C04 | Pending external | Cache identity/cleanup/apply controls pass locally; upgrade from the previous deployed artifact is not available here. |
| AT-D01 | Pass | Release defaults test covers English/Advanced/Metric/dark/Full Gym/3/60/15/balanced/all exclusions. All release-owned screens and domain errors use English copy, enforced by a static language audit. |
| AT-D02 | Simulated pass | Denied capability paths are non-blocking and diagnostic guidance is bounded. |
| AT-E01 | Pass | Start/resume and single-active-session tests. |
| AT-E02 | Pass | Duplicate operation identifier and retry idempotency tests. |
| AT-E03 | Pass | Forced transaction rollback, retry and stable diagnostic ID tests. |
| AT-E04 | Simulated pass | Persisted end-time timer recovery uses controlled clock fixtures. Physical background timing pending. |
| AT-E05 | Pass | UI copy and recovery logic make no guaranteed killed-process alarm claim. |
| AT-E06 | Pass | Active snapshot, position, completed sets and timer recovery tests plus offline browser reload. |
| AT-E07 | Pass | Finish transaction, timer cleanup, snapshot summary and pending proposals. |
| AT-E08 | Pass | Undo idempotency and persisted restoration tests. |
| AT-E09 | Pass | Alternative eligibility/explanation/original-versus-actual/history tests. |
| AT-E10 | Pass | Superset order/rest and rapid-transition exclusion tests. |
| AT-F01 | Pass | Reviewed/custom eligibility enforced in catalogue/generator tests. |
| AT-F02 | Pass | Reviewed seed media and subpath asset audits pass; offline precache generated. |
| AT-F03 | Pass | Never Suggest exclusion and retained-history tests. |
| AT-F04 | Pass | Custom image persistence and complete backup round trip. |
| AT-F05 | Pass | Exercise curation/licence/provenance audits have no blocker. |
| AT-G01 | Pass | Program CRUD/reorder/group/duplicate/activate/archive and snapshot isolation tests. |
| AT-G02 | Pass | Duration estimator component accounting and primary-rest invariant tests. |
| AT-G03 | Pass | Two-day/40 deterministic validation. |
| AT-G04 | Pass | Two-day/60 deterministic validation. |
| AT-G05 | Pass | Three-day/40 deterministic validation. |
| AT-G06 | Pass | Three-day/60 deterministic validation. |
| AT-G07 | Pass | Core 10/15 bounds and transition exclusion. |
| AT-G08 | Pass | Representative seeded hard-exclusion sweep. |
| AT-G09 | Pass | Same normalized input/revisions/seed produces identical output/explanation. |
| AT-G10 | Pass | Locked main exercise retained through accessory regeneration. |
| AT-G11 | Pass | Accept/reject/edit proposal mutation boundary tests. |
| AT-G12 | Pass | Discomfort hold/override tests. |
| AT-H01 | Pass | Raw history, records, estimated-label trend and text summary tests. |
| AT-H02 | Pass | Measurement CRUD/chart/export/restore tests. |
| AT-H03 | Pass | Orientation/resize/re-encode/thumbnail/Blob pipeline tests. |
| AT-H04 | Pass | Same-pose comparison, blur and object-URL cleanup tests. |
| AT-H05 | Pass | Quota failure rollback/no-orphan and stable error tests. |
| AT-I01 | Pass | Complete manifest/count/checksum/media export fixture. |
| AT-I02 | Pass | Clear then Replace restores record/media equivalence. |
| AT-I03 | Pass | Stable deduplication and pre-commit conflict resolution. |
| AT-I04 | Pass | Corrupt/future/oversized/traversal/checksum archives leave counts unchanged. |
| AT-I05 | Pass | Storage preflight rejects before mutation. |
| AT-J01 | Pass | Healthy non-destructive self-test fixture. |
| AT-J02 | Pass | Duplicate operation/orphan media/timer ownership/multiple-active invariant fixtures. |
| AT-J03 | Pass | Machine-readable and Markdown audit artifacts generated. |
| AT-J04 | Pass | Error ID links visible failure, redacted event, subsystem and build identity. |
| AT-J05 | Pass | 1,000-event/30-day pruning tests. |
| AT-K01 | Pass | Chromium 360×800 and 412×915: no critical-route horizontal overflow. |
| AT-K02 | Pass | Primary workout controls measured at least 48 CSS px. |
| AT-K03 | Partial | Visible focus/reorder controls/dialog patterns pass static/component checks; exhaustive physical keyboard/focus-return tour remains manual. |
| AT-K04 | Pass | WCAG AA contrast ratios, non-colour status and reduced-motion audit pass. |
| AT-K05 | Pass | Material UI is the sole detected UI system. |
| AT-L01 | Pass | Parameterized schema 2–7 migration fixtures preserve records and reopen at schema 8. |
| AT-L02 | Pass | Future/failed-open recovery preserves DB and surfaces safe recovery/diagnostic ID. |
| AT-L03 | Pass | Completed snapshot immutability tests. |

## Recovery drill

The CP7 complete backup fixture was rerun under the CP8 dependency/runtime set. Representative structured records, measurement, photo, thumbnail and custom image are exported with identity/counts/checksums; Replace after clear restores equivalent records/media; Merge deduplicates/reports conflicts; corrupt/future/unsafe/oversized/insufficient-storage cases are rejected before mutation. The browser release suite additionally proves an active session survives the service-worker control reload and subsequent offline reload.

## Executed commands

- `tsc --noEmit`;
- ESLint on release production domains, zero warnings;
- `node scripts/run-tests.mjs` — 27 files, 82 tests;
- all dependency/architecture/project/network/licence/asset/accessibility/performance audits;
- English release-copy audit across production TypeScript and TSX sources;
- Vite 6.4.3 production build and Pages subpath smoke;
- Playwright 1.61.1 — 12/12 across 360 and 412 projects;
- npm registry security audit through the strict exception checker.

## Release blockers outside local scope

1. complete the physical Android matrix;
2. deploy the single CI-verified Pages artifact;
3. verify deployed identity against the release-candidate commit/tag;
4. exercise previous-cache to cache-2 update and production smoke;
5. accept CP8 before creating `v1.0.0`.
