# Risk register

Scores: probability and impact from 1 (low) to 5 (high). Exposure = probability × impact.

| ID | Risk | P | I | Exposure | Prevention | Detection | Contingency | Owner checkpoint |
|---|---|---:|---:|---:|---|---|---|---|
| R-01 | RepQuest schema is weaker/more coupled than expected | 4 | 4 | 16 | Task 00 inventory; repository seams | architecture/database audit | strangler migration; preserve legacy adapter | CP0–CP3 |
| R-02 | Big-bang redesign breaks workout reliability | 4 | 5 | 20 | vertical slice first; small PRs | E2E and checkpoint tests | revert checkpoint; keep legacy screen temporarily | CP2–CP3 |
| R-03 | Donor code imports server/UI framework coupling | 4 | 4 | 16 | A/B/C/D donor classification; MUI-only | dependency/bundle audit | reimplement pattern; remove dependency | CP0–CP2 |
| R-04 | Licence or media rights unclear | 3 | 5 | 15 | immutable source pin; no unverified video/media | provenance and licence audit | remove/replace asset/code | all |
| R-05 | Active workout data loss | 3 | 5 | 15 | transactional autosave; idempotency | reload/kill/failure tests | recovery snapshot and diagnostics | CP3 |
| R-06 | Duplicate sets on double tap/retry | 4 | 4 | 16 | operation IDs; unique guard | concurrency tests | dedupe repair tool | CP3 |
| R-07 | Service-worker update causes stale/broken state | 4 | 4 | 16 | prompt update; active deferral | update E2E; build identity | cache recovery action | CP1–CP3 |
| R-08 | GitHub Pages subpath/routing blank page | 3 | 5 | 15 | hash router; base-path test | deployed smoke test | rollback deploy; diagnostics reset | CP1 |
| R-09 | Browser evicts local data | 2 | 5 | 10 | persistence request; backup reminders | storage status | restore backup | CP7 |
| R-10 | Photos exhaust quota | 3 | 4 | 12 | compression, size caps, usage UI | quota tests/status | delete/export guidance | CP7 |
| R-11 | Backup is incomplete or not restorable | 3 | 5 | 15 | checksums, preflight, round-trip | clear/restore E2E | retain old export reader; repair tool | CP7 |
| R-12 | Migration corrupts legacy data | 3 | 5 | 15 | fixtures, journal, postchecks | migration tests | recovery build/forward fix | every schema change |
| R-13 | Generator violates back-related exclusions | 2 | 5 | 10 | shared hard filter and post-validator | property tests | disable generation; manual programs remain | CP6 |
| R-14 | Duration estimates are misleading | 4 | 3 | 12 | complete budget model; history calibration | tolerance tests | show warning/adjust accessories | CP5–CP6 |
| R-15 | PWA background alert expectations cannot be met | 4 | 3 | 12 | clear copy; timestamp truth | Android manual test | no false guarantee; recover on reopen | CP3 |
| R-16 | Diagnostics leak personal data | 2 | 5 | 10 | allow-list redaction | leak tests | disable export until fixed | CP1–CP7 |
| R-17 | Scope grows before core reliability | 4 | 4 | 16 | checkpoint order; out-of-scope list | PR scope review | defer item; revert expansion | all |
| R-18 | Exercise dataset quality inconsistent | 4 | 3 | 12 | reviewed subset and overrides | curation report | generator uses reviewed only | CP4 |
| R-19 | Seed update overwrites user edits/history | 3 | 4 | 12 | separate source/user fields | seed migration tests | restore/repair mapping | CP4+ |
| R-20 | Bundle/performance degrades | 3 | 3 | 9 | one UI system; lazy media/routes | bundle diff | remove donor dependency; optimize assets | CP2+ |
| R-21 | Accessibility added too late | 3 | 4 | 12 | baseline at CP2; component rules | axe/keyboard/visual tests | block checkpoint and remediate | CP2+ |
| R-22 | Codex attempts entire project in one change | 4 | 5 | 20 | task files and stop rules | PR size/checkpoint report | reject PR, reset to checkpoint | all |
| R-23 | Error cannot be reproduced | 3 | 4 | 12 | build identity, stable error IDs, support bundle | diagnostics | bisect/checkpoint comparison | CP1+ |
| R-24 | Domain and Dexie become tightly coupled | 3 | 4 | 12 | repository interfaces and architecture test | dependency audit | extract service/adapters | CP1–CP5 |
| R-25 | Origin changes after release | 2 | 5 | 10 | stable repository/page URL | release checklist | mandatory backup and import to new origin | CP8 |
| R-26 | Vulnerable or obsolete baseline dependencies | 4 | 4 | 16 | pin supported runtime; remove unused network packages; controlled upgrades | clean-install audit and dependency scan | isolate upgrades in CP1 with build and data regression tests | CP1 |

## CP0 audit evidence — 2026-08-06

- `R-01`, `R-05`, `R-06`, and `R-24` are confirmed baseline risks: feature contexts and pages access Dexie tables directly, while the active workout and rest state are serialized to `localStorage` without operation identifiers or a persistent session entity.
- `R-03` is confirmed: Workout.cool commit `e3dcd23b4ebdfb6254010b9a7c350cfef9e236c8` depends on Next.js, Prisma/PostgreSQL, Better Auth, Stripe, Tailwind, Radix, DaisyUI, Zustand, server actions, advertisements, premium, and social features. Its patterns are reference material only by default.
- `R-07` is confirmed: RepQuest configures `registerType: 'autoUpdate'` and calls `registerSW({immediate: true})`; there is no active-workout update deferral.
- `R-08` is confirmed: Vite uses `base: '/'`, while the target is the `/max-and-gym/` GitHub Pages project subpath.
- `R-16` and the privacy side of `R-23` are confirmed: the baseline includes Alceris, optional Sentry offline transport, optional Supabase authentication, remote exercise images, YouTube embeds, and unredacted `console` calls.
- `R-20` is confirmed: the production artifact is 6,683,843 bytes; the main JavaScript chunk is 1,796,339 bytes and the exercise-data chunk is 846,982 bytes.
- `R-26` is confirmed: clean installation reports 38 known vulnerabilities (4 low, 10 moderate, 23 high, 1 critical) and multiple deprecated Workbox-era packages. No automatic upgrade is applied during CP0.

## CP1 stabilization evidence — 2026-08-06

- `R-07` is reduced: updates use the prompt state, expose waiting state, and defer when `workoutContext.timeStarted` is present. Cache cleanup remains isolated from IndexedDB.
- `R-08` is reduced: the production bundle and manifest pass the `/max-and-gym/` subpath smoke test with hash routing.
- `R-16` is reduced: diagnostic context is allow-listed, events are bounded, production console arguments are suppressed, and induced secret fixtures remain absent from the screen and local event record.
- `R-23` is reduced: build `version + Git SHA`, stable error code, UUID and schema identity are visible and stored locally.
- `R-26` remains open: removing unused network packages lowers the clean audit from 38 to 23 known vulnerabilities (1 low, 6 moderate, 15 high, 1 critical), but upgrades are deferred to isolated dependency work because forced automatic remediation is unsafe.
- `R-20` remains open: the CP1 artifact is 6,456,260 bytes. The main chunk is 1,568,929 bytes and the exercise-data chunk is 846,982 bytes; later route/data splitting is still required.
