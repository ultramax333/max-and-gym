# Task 06 — Generator validation

## Result

The generator is pure, deterministic and fail-closed. It accepts normalized inputs, explicit catalog/program/generator revisions and a seed, then returns either a complete explained program or a typed failure with exclusions.

## Coverage

| Requirement | Implementation and evidence |
|---|---|
| GEN-001 / GEN-012 | `src/generator/deterministicGenerator.ts` normalizes unordered inputs and hashes the complete versioned input. Equal normalized inputs replay to equal programs and explanations; a changed version changes identity. |
| GEN-002 | `src/generator/constraints.ts` is shared by program and core selection. It excludes archived, ineligible, unreviewed, Never Suggest, blocked exercise/tag and unavailable-equipment candidates before scoring. |
| GEN-003 | Candidate score records goal, priority muscle, favourite, reviewed-media and setup-cost reasons, followed by a stable hash tie-break and exercise-ID tie-break. |
| GEN-004 / GEN-005 | Reviewed Full Body A/B and A/B/C role templates live in `src/generator/seedPrograms.ts`. |
| GEN-006 | Every day stores warm-up, ramps, execution, prescribed rest, setup, transitions, conditioning, total and target seconds. Primary rest is never shortened. 40-minute results stay in 36–44 minutes; 60-minute results stay in 54–66 minutes. |
| GEN-007 / GEN-008 | `src/generator/coreWarmup.ts` generates exact 10/15-minute position-clustered core sessions. Dynamic warm-up is 4–6 minutes with the optional low-back-comfort sequence. |
| GEN-009 / GEN-010 | Stable inputs preserve exercise, prescription and lock state. Accessory regeneration changes only unlocked `accessory` roles; repository tests also verify the persisted protected diff. |
| GEN-011 | Normalized input, selection/exclusion reasons, duration, weekly movement/muscle balance, warnings, seed and versions are persisted on the generated draft and displayed in its preview. |
| GEN-018 | `src/generator/deterministicGenerator.test.ts` covers all four frequency/duration combinations, seed fixtures, duration bounds, weekly coverage, core bounds, determinism and 120 representative hard-exclusion seeds. |

## Seed identities

- generator: `deterministic-v1`;
- program templates: `maxgym-seed-programs-v1`;
- generated programs persist the normalized input, full explanation and replayable program snapshot;
- database schema 7 adds progression proposals without rewriting existing program or workout history.

## Validation status

Automated domain, persistence, type and lint gates pass. The generated-program repository test verifies an explicit draft, version/seed snapshots and stored day content. Accessory rotation is optional for 40-minute plans when the duration estimator removes it first; 60-minute plans retain it and exercise the persisted regeneration path.
