# Checkpoint report — CP0 / Task 00

## Summary

- Task: 00 — Audit RepQuest and Workout.cool donor
- Pull request: not opened; no user-owned GitHub fork/remote is configured
- Base commit: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Working branch: `task/00-audit-base-donor`
- Checkpoint: CP0
- Status: locally ready for review; not accepted until pushed to the user fork and reviewed
- User-visible result: no product behavior change; complete baseline evidence and migration plan

## Scope delivered

Requirement IDs: `FND-001`, `FND-002`, `FND-003`, `PWA-001`, `SEC-001`, `SEC-002`, `UI-001`, `UI-002`, `DIA-001`, `FND-004`, `FND-005`.

Out of scope confirmed:

- no UI redesign;
- no database schema change;
- no exercise import;
- no max&gym product feature;
- no copied Workout.cool code;
- no dependency upgrade or audit auto-fix.

## Artifacts

- `00-baseline-environment.md`
- `00-current-architecture.md`
- `00-database-audit.md`
- `00-pwa-deployment-audit.md`
- `00-network-privacy-licence-audit.md`
- `00-ui-donor-matrix.md`
- `00-migration-plan.md`
- baseline screenshots under `docs/reports/screenshots/`
- updated `SOURCE_PINS.json`, `THIRD_PARTY_NOTICES.md`, and `docs/spec/RISK_REGISTER.md`

## Architecture and data changes

- Modules: documentation package added only.
- Dependencies: unchanged.
- Database schema: unchanged (RepQuest version 3, master version 1).
- Export format: unchanged/unversioned baseline.
- Exercise/program seed: unchanged; Free Exercise DB pin deferred to Task 04.
- Generator: not implemented.
- Cache/service worker: unchanged baseline auto-update behavior.
- Runtime origins: unchanged and documented.
- Donor code: none.

## Verification

| Gate | Command/test | Result | Evidence |
|---|---|---|---|
| Handoff integrity | SHA-256 check against manifest | Pass, 88/88 |
| Clean install | `npm ci` | Pass |
| Type check | `tsc` via build script | Pass |
| Lint | unavailable | Missing script, CP1 blocker |
| Unit/component/migration tests | inventory | No test files/scripts, CP1 blocker |
| Stock build | `npm run build` | Blocked by Codex sandbox parent-directory denial during config loading |
| Equivalent production graph | Vite API with same React/PWA config | Pass, 13,462 modules |
| Static smoke | HTTP server + request | Pass, HTTP 200 |
| Visual smoke | in-app browser at 360×800, 412×915, 1440×900 | Pass with baseline visual warnings |
| Project/network/licence audit | manual CP0 inventory | Pass as documented baseline; automation belongs to CP1 |

## Findings and checkpoint decision

CP0's purpose is to understand the baseline, not make it compliant. The baseline is reproducible enough to migrate and every major blocker is evidenced:

- direct UI-to-Dexie coupling;
- localStorage active workout without idempotency;
- destructive/unvalidated restore path;
- auto-updating service worker and wrong GitHub Pages base;
- unconditional Alceris plus optional Sentry/Supabase and remote media;
- zero automated tests and CI that can mask failure;
- large bundles and 38 known dependency vulnerabilities;
- donor framework/server/commercial coupling.

## Risk and recovery

- No production data or schema was modified.
- Removing this branch restores the exact RepQuest base commit.
- `node_modules/`, `build/`, and donor audit checkout are local ignored/untracked runtime material outside committed deliverables.
- The running local server serves only the CP0 baseline artifact.

## Acceptance decision

- CP0 evidence criteria met locally: yes.
- Global checkpoint criteria met: not yet; the branch must be committed/pushed to a user-owned fork, the stock build must be reconfirmed in normal CI, and a pull request must be reviewed.
- Local continuation exception: on 2026-08-06, the user explicitly authorized continuing without their Git identity or GitHub fork being available. A clearly local placeholder author is used; no remote push or pull request is performed.
- Recommended action before remote collaboration: replace or accept the local author metadata, configure the user's `max-and-gym` fork, push the CP0 branch, and open the review pull request.
