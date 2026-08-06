# Requirement traceability matrix

This matrix links every implementation requirement in `BACKLOG.md` to its owning task, checkpoint, and release acceptance evidence. Update the row in the same pull request when a requirement is split, removed, or its verification changes.

| Requirement | Description | Task | Checkpoint | Acceptance evidence |
|---|---|---:|---:|---|
| FND-001 | Pin RepQuest commit and baseline environment | 00 | CP0 | AT-A01 |
| FND-002 | Inventory routes, modules, dependencies, tests, build | 00 | CP0 | AT-J03 |
| FND-003 | Inventory Dexie schema and data flows | 00 | CP0 | AT-J03, AT-L01 |
| PWA-001 | Inventory manifest, service worker, cache, deployment | 00 | CP0 | AT-C01, AT-J03 |
| SEC-001 | Inventory Sentry, Alceris, telemetry, runtime origins | 00 | CP0 | AT-B01, AT-J03 |
| SEC-002 | Inventory licences | 00 | CP0 | AT-F05, AT-K05 |
| UI-001 | Audit Workout.cool UI donor at pinned commit | 00 | CP0 | AT-K05 |
| UI-002 | Classify donor patterns A/B/C/D | 00 | CP0 | AT-K05 |
| DIA-001 | Create baseline audit and risk reports | 00 | CP0 | AT-J03 |
| FND-004 | Produce preserve/refactor/replace map | 00 | CP0 | AT-J03 |
| FND-005 | Produce migration plan | 00 | CP0 | AT-L01, AT-L02 |
| FND-010 | Pin supported Node/npm and lockfile | 01 | CP1 | AT-A01; `01-stabilization-audit.md` |
| FND-011 | Establish strict type/lint/test/build scripts | 01 | CP1 | AT-A01, AT-J03; `01-stabilization-audit.md` |
| FND-012 | Establish pull-request continuous integration | 01 | CP1 | AT-A01, AT-J03; `.github/workflows/quality.yml` |
| SEC-010 | Remove telemetry, Sentry, Alceris, remote scripts/fonts | 01 | CP1 | AT-B01; `artifacts/audit/network-audit.md` |
| SEC-011 | Add runtime-origin policy test | 01 | CP1 | AT-B01; `networkAudit.test.ts` |
| PWA-010 | Configure static subpath build and route smoke test | 01 | CP1 | AT-A02; `smoke-pages.mjs` |
| PWA-011 | Configure prompt-based service-worker updates | 01 | CP1 | AT-C03, AT-C04; `pwaConfig.test.ts` |
| DIA-010 | Add build identity | 01 | CP1 | AT-A03; Diagnostics screenshots |
| DIA-011 | Add stable error-code framework and redaction | 01 | CP1 | AT-B03, AT-J04; redaction/console tests |
| DIA-012 | Add diagnostic event storage/retention | 01 | CP1 | AT-J05; `retention.test.ts` |
| DIA-013 | Add root/route boundaries | 01 | CP1 | AT-J04; route-boundary screenshot |
| DIA-014 | Add `doctor` and `audit:project` | 01 | CP1 | AT-J03; `artifacts/audit/` |
| DIA-015 | Add initial Diagnostics screen | 01 | CP1 | AT-A03, AT-J01; Diagnostics screenshots |
| DIA-016 | Add migration/operation journal foundation | 01 | CP1 | AT-J02, AT-L01, AT-L02; diagnostics database v1 |
| UI-010 | Implement max&gym Material UI tokens/theme | 02 | CP2 | AT-K04 |
| UI-011 | Implement responsive AppShell | 02 | CP2 | AT-K01 |
| UI-012 | Implement five-item mobile navigation | 02 | CP2 | AT-K01, AT-K03 |
| UI-013 | Implement desktop navigation | 02 | CP2 | AT-K03 |
| UI-014 | Implement core action/input/state components | 02 | CP2 | AT-K02, AT-K03, AT-K04 |
| UI-015 | Implement route shells | 02 | CP2 | AT-A02, AT-K01 |
| UI-016 | Implement onboarding and Settings shells | 02 | CP2 | AT-D01, AT-D02 |
| UI-017 | Add loading/empty/error/offline states | 02 | CP2 | AT-K01, AT-K03, AT-J04 |
| UI-018 | Establish visual-regression baseline | 02 | CP2 | AT-K01, AT-K04 |
| UI-019 | Establish accessibility baseline | 02 | CP2 | AT-K02, AT-K03, AT-K04 |
| UI-020 | Record any donor-code adaptation | 02 | CP2 | AT-K05 |
| WKT-001 | Define workout repository/application-service boundary | 03 | CP3 | AT-E01–AT-E10 |
| WKT-002 | Create/resume active session transactionally | 03 | CP3 | AT-E01, AT-E06 |
| WKT-003 | Render current exercise and sets | 03 | CP3 | AT-E01, AT-K01 |
| WKT-004 | Enter actual load, repetitions, effort | 03 | CP3 | AT-E02, AT-E03, AT-K01, AT-K02 |
| WKT-005 | Complete set idempotently | 03 | CP3 | AT-E02, AT-E03 |
| WKT-006 | Undo recent set action | 03 | CP3 | AT-E08 |
| WKT-007 | Persist/restore active position | 03 | CP3 | AT-E06 |
| WKT-008 | Implement timestamp rest timer | 03 | CP3 | AT-E04, AT-E05 |
| WKT-009 | Add sound/vibration best-effort feedback | 03 | CP3 | AT-D02, AT-E05 |
| WKT-010 | Add wake lock progressive enhancement | 03 | CP3 | AT-D02, AT-E05 |
| WKT-011 | Pause/resume workout | 03 | CP3 | AT-E06 |
| WKT-012 | Finish and summarize session | 03 | CP3 | AT-E07 |
| WKT-013 | Add refresh/browser-close recovery | 03 | CP3 | AT-E06 |
| WKT-014 | Add workout error boundary and recovery diagnostics | 03 | CP3 | AT-E03, AT-J04 |
| PWA-020 | Defer update while workout active | 03 | CP3 | AT-C03 |
| PWA-021 | Offline workout end-to-end test | 03 | CP3 | AT-C02, AT-E06 |
| EXR-001 | Pin upstream dataset revision | 04 | CP4 | AT-F05 |
| EXR-002 | Define exercise/metadata/media schema | 04 | CP4 | AT-F01, AT-F05 |
| EXR-003 | Build allowlist/override curation pipeline | 04 | CP4 | AT-F01, AT-F05 |
| EXR-004 | Validate/dedupe/tag content | 04 | CP4 | AT-F01, AT-F03, AT-F05 |
| EXR-005 | Process thumbnails/detail images | 04 | CP4 | AT-F02 |
| EXR-006 | Build reviewed seed subset for seed programs | 04 | CP4 | AT-F01, AT-F02, AT-F05 |
| EXR-007 | Expand to 150–220 reviewed exercises | 04 | CP4 | AT-F01, AT-F02, AT-F05 |
| EXR-008 | Search and filters | 04 | CP4 | AT-F01 |
| EXR-009 | Exercise detail | 04 | CP4 | AT-F02, AT-K01 |
| EXR-010 | Favourite and Never Suggest | 04 | CP4 | AT-F03 |
| EXR-011 | Alternatives | 04 | CP4 | AT-E09, AT-G08 |
| EXR-012 | Custom exercise and one local image | 04 | CP4 | AT-F04, AT-I01 |
| EXR-013 | Offline media/cache rules | 04 | CP4 | AT-C02, AT-F02 |
| EXR-014 | Curation, source, licence, and asset audit | 04 | CP4 | AT-F05, AT-K05 |
| PRG-001 | Program repository/entities | 05 | CP5 | AT-G01 |
| PRG-002 | List/detail/status | 05 | CP5 | AT-G01 |
| PRG-003 | Manual create/edit | 05 | CP5 | AT-G01 |
| PRG-004 | Day and exercise reordering | 05 | CP5 | AT-G01, AT-K03 |
| PRG-005 | Superset/triset/circuit groups | 05 | CP5 | AT-E10, AT-G01 |
| PRG-006 | Prescriptions | 05 | CP5 | AT-G01, AT-G02 |
| PRG-007 | Progression-rule assignment | 05 | CP5 | AT-G11 |
| PRG-008 | Alternatives and locked main exercise | 05 | CP5 | AT-E09, AT-G10 |
| PRG-009 | Duration estimator | 05 | CP5 | AT-G02 |
| PRG-010 | Weekly movement/muscle balance | 05 | CP5 | AT-G03–AT-G06 |
| PRG-011 | Duplicate/archive/activate | 05 | CP5 | AT-G01 |
| PRG-012 | Immutable session snapshots | 05 | CP5 | AT-L03 |
| PRG-013 | Accessible non-drag reorder controls | 05 | CP5 | AT-K03 |
| GEN-001 | Input normalization | 06 | CP6 | AT-G03–AT-G09 |
| GEN-002 | Shared hard-constraint service | 06 | CP6 | AT-E09, AT-E10, AT-G08 |
| GEN-003 | Candidate scoring | 06 | CP6 | AT-G03–AT-G06 |
| GEN-004 | Two-day structure | 06 | CP6 | AT-G03, AT-G04 |
| GEN-005 | Three-day structure | 06 | CP6 | AT-G05, AT-G06 |
| GEN-006 | 40/60-minute time budget | 06 | CP6 | AT-G02–AT-G06 |
| GEN-007 | 10/15-minute core generator | 06 | CP6 | AT-G07, AT-G08 |
| GEN-008 | Warm-up generator | 06 | CP6 | AT-G08 |
| GEN-009 | Stable main exercises | 06 | CP6 | AT-G10 |
| GEN-010 | Regenerate accessories only | 06 | CP6 | AT-G10 |
| GEN-011 | Generator explanation snapshot | 06 | CP6 | AT-G09 |
| GEN-012 | Determinism and versioning | 06 | CP6 | AT-G09 |
| GEN-013 | Double progression | 06 | CP6 | AT-G11, AT-G12 |
| GEN-014 | Fixed increment and top/back-off | 06 | CP6 | AT-G11 |
| GEN-015 | Conditioning progression | 06 | CP6 | AT-G11 |
| GEN-016 | Deload review proposal | 06 | CP6 | AT-G11, AT-G12 |
| GEN-017 | Accept/edit/reject/postpone | 06 | CP6 | AT-G11, AT-G12 |
| GEN-018 | Property and duration tests | 06 | CP6 | AT-G02–AT-G10 |
| PRO-001 | Workout history | 07 | CP7 | AT-H01 |
| PRO-002 | Exercise progress/records/estimated max | 07 | CP7 | AT-H01 |
| PRO-003 | Frequency/duration/volume summaries | 07 | CP7 | AT-H01 |
| PRO-004 | Body weight and measurements | 07 | CP7 | AT-H02 |
| PRO-005 | Photo input | 07 | CP7 | AT-H03 |
| PRO-006 | Orientation/re-encoding/compression | 07 | CP7 | AT-H03 |
| PRO-007 | Thumbnail/blur/comparison | 07 | CP7 | AT-H04 |
| PRO-008 | Media storage/cleanup | 07 | CP7 | AT-B02, AT-H05 |
| BKP-001 | Personal backup manifest and ZIP | 07 | CP7 | AT-I01 |
| BKP-002 | Checksums and preflight | 07 | CP7 | AT-I01 |
| BKP-003 | Replace import | 07 | CP7 | AT-I02, AT-I04, AT-I05 |
| BKP-004 | Merge import | 07 | CP7 | AT-I03, AT-I04, AT-I05 |
| BKP-005 | Pre-import snapshot and rollback | 07 | CP7 | AT-I04, AT-I05 |
| BKP-006 | Backup reminder and storage report | 07 | CP7 | AT-I01, AT-I05 |
| DIA-020 | Complete self-test | 07 | CP7 | AT-J01, AT-J02 |
| DIA-021 | Complete redacted diagnostic export | 07 | CP7 | AT-B03 |
| DIA-022 | Sensitive-data leak tests | 07 | CP7 | AT-B02, AT-B03 |
| FND-090 | Full acceptance suite | 08 | CP8 | AT-A01–AT-L03 |
| PWA-090 | Install/offline/update production test | 08 | CP8 | AT-A02, AT-C01–AT-C04 |
| UI-090 | Accessibility remediation | 08 | CP8 | AT-K01–AT-K04 |
| UI-091 | Visual regression review | 08 | CP8 | AT-K01, AT-K04 |
| FND-091 | Performance/bundle optimization | 08 | CP8 | AT-A01, AT-K01 |
| SEC-090 | Network/privacy audit | 08 | CP8 | AT-B01–AT-B03 |
| SEC-091 | Licence/provenance audit | 08 | CP8 | AT-F05, AT-K05 |
| BKP-090 | Backup recovery drill | 08 | CP8 | AT-I01–AT-I05 |
| DIA-090 | Audit comparison against CP0 | 08 | CP8 | AT-J01–AT-J05 |
| FND-092 | User documentation | 08 | CP8 | AT-C01, AT-D01, AT-I01 |
| FND-093 | Release notes/tag/deployment | 08 | CP8 | AT-A01–AT-A03, AT-C01 |
| FND-094 | Post-release smoke and rollback verification | 08 | CP8 | AT-A02, AT-C02–AT-C04, AT-I02 |

## Maintenance rules

- Every backlog requirement appears exactly once.
- A requirement may have several acceptance tests.
- An acceptance test may cover several implementation requirements.
- Checkpoint reports list the requirement rows delivered by that pull request.
- A requirement cannot be marked complete merely because the UI exists; its acceptance evidence must pass.
- Task 90 incident work references the affected requirement IDs but does not add normal backlog requirements unless the product design changes.
