# Exercise groups and equipment — root-cause investigation

## Summary

- Reported: 2026-09-08; MODE=DIAGNOSE. No product changes or deployment.
- Inspected version: 1.11.0, commit `91d26fdaa905ddba42157f8764a03d3d2ce97b73`.
- Latest accepted release report: `docs/reports/104-v1.11.0-ui-studio.md`.
- User reports upper-body exercises in Glutes and potentially wrong equipment. Exact exercise names, screen and phone build not supplied; matching the user's precise occurrence remains unproven.
- Severity: medium content/selection correctness; reproducible defects confirmed.
- DB 8, export 2, seed `fedb-b0eed061e1c8-reviewed-6`, generator `deterministic-v9`, cache 9.
- No personal data accessed; backup confirmation not applicable to this read-only investigation. Preexisting worktree edits preserved.

## Proven facts and earliest causes

1. `scripts/build-exercise-catalog.mjs:100` classifies any name containing `kickback` as `hinge`, without checking muscles. The bundled **Tricep Dumbbell Kickback** correctly declares triceps but incorrectly declares hinge. `matchesRole(..., 'posterior-assistance')` accepts it.
2. `ExerciseCatalogRepository.alternatives` accepts matching movement pattern **OR** overlapping primary muscles. Thus a hip thrust offers the triceps kickback; a Thigh Abductor offers biceps curls because both are broad `accessory` movements. Actual repository method invoked by the diagnostic probe, with synthetic list data and normal alphabetical ordering for the abductor example.
3. `ActiveWorkoutPage.openAlternatives` uses that generic method, merges saved preferred IDs, and filters only Never Suggest and already-selected IDs. It does not constrain by persisted `trainingContext.zone` or available equipment. The quick-generator replacement dialog uses a separate, stricter zone filter. Preferred records also lack a complete current eligibility/archival recheck here.
4. Equipment is copied directly from the upstream single `equipment` field (`build-exercise-catalog.mjs:124`). **Seated Band Hamstring Curl** and **Band Assisted Pull-Up** are `other`; their own instructions explicitly require a band. The seated curl also needs a bench. This is a concrete inconsistency between declared equipment and bundled instructions, not a medical inference.
5. The hand-maintained bench station list omits **Barbell Squat To A Bench**. `requiredStations` returns only `barbell`, omitting the bench. Name-based spot checks are diagnostic indicators, not an exhaustive equipment review.

## Important distinctions / excluded explanations

- Fresh quick-session Glutes generation uses primary muscles plus six explicit curated lower-body exceptions. Across 100 fixed seeds at 45 minutes/hypertrophy/all equipment, all 100 succeeded and every selected exercise had lower-body primary muscles. No upper-body initial generation was reproduced under these inputs; this does not prove every duration/goal/profile combination.
- The library muscle filter includes secondary muscles. Therefore a Glutes library search can include multi-region movements such as Clean and Press (not generator eligible) or Landmine 180's (core primary), based on their source secondary tags. This is distinct from a Glutes-only session and can be misleading without primary/secondary filter wording.
- A dumbbell exercise grouped under Bench can be intentional: session setup chooses the earliest requested station among required stations. Equipment badges separately retain actual requirements. Supersets remain whole blocks, so the heading describes a block's chosen station, not necessarily every member's individual equipment.
- For the demonstrated defects, cache, network and Android rendering are unnecessary: they reproduce directly from checked-in data/domain methods. No phone-state diagnosis is claimed.

## Evidence and verification

Diagnostic files: `artifacts/incidents/2026-09-08-classification/probe.test.ts` and `run.mjs` (not production test/source edits).

Commands use the configured Node 24 executable:

| Command | Result |
|---|---|
| `node artifacts/incidents/2026-09-08-classification/run.mjs` | 5 expected failures: posterior role, hip-thrust alternatives, abductor alternatives, band tag, missing bench; 1 passing 100-seed Glutes check |
| `node scripts/run-tests.mjs src/generator/quickSession.test.ts src/exerciseCatalog/ExerciseCatalogRepository.test.ts src/workout/equipmentStations.test.ts` | 38 existing tests pass, showing missing cross-screen/content regression coverage |
| `node scripts/doctor.mjs` | Exit 0, dependencies installed, Node 24.19.0; schema3/prompt labels are stale and are not accepted as current identity |

No full build/release gate rerun for this read-only diagnosis. Existing dirty audit artifacts were not regenerated/overwritten. Browser/installed-phone, user profile and previous-version reproduction not performed. First bad commit not established; these rules predate the UI-only v1.11.0 change. No claim of a new visual-release regression.

## Minimum correction proposal (requires owner Go)

1. Add reviewed movement/equipment overrides to catalogue construction; triceps kickbacks must not count as hip extension. Review the rest of the catalogue for analogous semantic collisions and equipment/instruction mismatches.
2. Centralize context-aware alternatives for generation and active sessions. Require meaningful target compatibility; a broad `accessory` or `hinge` label alone is insufficient. Recheck preferred IDs against current eligibility, archival state, hard exclusions and session context.
3. Define equipment alternatives versus cumulative requirements explicitly before replacing the existing `some` availability check with anything stricter. A band plus a bar is a cumulative requirement; different setups may be alternatives. Preserve intentional Bench grouping and whole supersets while correcting missing station metadata.
4. Bump exercise seed identity for reviewed record updates, preserve stable IDs, favourites, exclusions, contextual ratings and completed-session snapshots. Generator identity should increment if candidate selection changes. Do not silently rewrite saved/active exercises or historical snapshots.
5. Promote the incident regressions into permanent tests; add active-dialog tests including stale preferred IDs, all goals/zones and material requirements. Re-run catalogue reproducibility, repository, generation, workout, migration, browser and full quality gates before release.

## Impact, recovery and verdict

- Requirements: AT-E09, AT-F01/F03, AT-G08, AT-M01; known modes FM-20/FM-31/FM-37.
- No demonstrated data loss, new network origin or licensing change. Content corrections should use existing source provenance plus explicit reviewed overrides.
- Existing saved sessions may preserve wrong selections; expose deliberate replacement rather than modifying them automatically. No uninstall, cache clear or DB reset.
- Rollback of future selection changes is code-only if schema remains unchanged; already refreshed seed rows require an explicit forward seed correction. Android rollback still needs a higher versionCode.
- No new diagnostic code or production changes in DIAGNOSE mode.
- Verdict: selection/content defects proven, user's exact screen occurrence not yet identified. Ready for scoped correction after approval; screenshot or exercise names can additionally confirm the phone-specific case.
