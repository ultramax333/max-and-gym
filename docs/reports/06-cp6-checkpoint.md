# CP6 checkpoint — Deterministic generator and progression

## Summary

- Task: 06 — deterministic generator and progression;
- Base commit: `7fb5420` (CP5);
- Branch: `task/06-generator-and-progression`;
- Checkpoint: CP6;
- Status: ready for user acceptance after local verification;
- user-visible result: generate an explained 2/3-day, 40/60-minute draft; preview 10/15-minute core; regenerate unlocked accessories; review pending progression proposals.

## Scope delivered

Requirement IDs: `GEN-001` through `GEN-018`.

Out of scope: photos, charts, backup/import and release hardening remain assigned to later tasks.

## Architecture and data

- pure generator modules under `src/generator`, with no React, Dexie or ambient clock dependency;
- shared hard-constraint service and reviewed seed templates;
- generated draft snapshots carry normalized input, explanation, program, seed and version;
- schema 7 adds `progressionProposal` records and preserves all existing tables/data;
- workout snapshots now carry an optional program-exercise identity for idempotent proposal creation;
- no new package or network dependency.

## Verification gates

| Gate | Result | Evidence |
|---|---|---|
| TypeScript strict | Pass | `tsc --noEmit` |
| ESLint | Pass | Task 06 domains, routes and screens with zero warnings |
| Generator domain | Pass | four formats, core 10/15, determinism, fixtures, 120 exclusion seeds, locks and duration bounds |
| Progression domain | Pass | all rule families, success/hold/regression and discomfort |
| Persistence | Pass | generated snapshot, accessory-only diff, proposal creation and explicit proposal actions |
| Full regression | Pass: 18 files, 57 tests | `node scripts/run-tests.mjs` |
| Production build/audits | Pass | production PWA build, route smoke, project, network, licence and exercise-asset audits |
| Browser visual | Pass | generator → preview → saved draft → accessory regeneration; empty proposal route and no-silent-change notice |

Detailed evidence is recorded in `06-generator-validation.md` and `06-progression-validation.md`.

## Risk and recovery

- A 40-minute day may omit the optional accessory to remain inside tolerance; this is intentional and explained by the duration result.
- A generator version change creates a different replay identity instead of silently treating output as compatible.
- Schema changes are additive. Recovery is forward-only; existing programs and completed workout snapshots remain readable.

## Acceptance decision

- checkpoint criteria: met;
- blocking defects: none;
- recommended action: accept CP6 after reviewing the final local verification summary;
- `PROJECT_STATUS.md` remains unchanged until the checkpoint is accepted and merged.
