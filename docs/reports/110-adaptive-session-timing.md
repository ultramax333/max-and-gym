# CP — Working-set removal and personal duration estimates

Date: 2026-10-11. Base: aa3ad04 (master, v1.12.0).
Candidate: v1.13.0, generator deterministic-v15.
Incident/task: Task 90; owner-requested FIX, clarified as removing a whole set.

## Behavior and scope

- Add Remove one set beside Add one set, with a confirmation describing the
  effect. Only an unstarted working set can be removed; keep at least one.
- Preserve logged/undone work, timer ownership, recovery and the original session
  target. Repair the active position when its last pending set is removed.
- Reassign a set to an untouched eligible future exercise only when the target
  has room. Do not redistribute when already overdue or when the new set would
  exceed the target. Respect locked exercises and grouped-set boundaries.
- Show remaining work, projected total and over-target warning live.
- Learn local per-exercise pace separately by goal, from the latest 30 completed
  sessions. Require three reliable intervals; confidence grows over eight samples.
  Exclude transitions, supersets, pauses, sparse history and long interruptions.
  Preserve skipped/adjusted recovery timing instead of overwriting old timers.
- Apply learned estimates to quick/weekly generation and exercise replacements.
  Reduce working volume when needed; never shorten selected recovery to fit.

## Persistence and architecture

New timing calculations are pure domain functions in src/workout/timing.ts.
Historical reads use the workout repository/application service, not UI table
access. Removal is transactional and operation-ID idempotent.

Optional set active-elapsed and timer duration/stop snapshots need no store/index
change: schema 8, export 2 and cache 9 remain unchanged. Backup/restore preserves
the optional fields. Legacy unpaused history is used only when recovery can be
separated reliably; old paused history without elapsed snapshots is excluded.
No network calls, new packages, donor code or real user fixtures added.

CI discovered existing critical advisory GHSA-rvm3-566m-v7fv in
@capacitor/android 8.5.0. Update only that package to 8.5.3 (same minor), retaining
compatible core/CLI 8.5.0. Registry peer requirements remain ^8.5.0; exact tarball
and integrity come from publisher metadata. The maintained advisory identifies
8.5.1 as patched: https://github.com/ionic-team/capacitor/security/advisories/GHSA-rvm3-566m-v7fv.
Do not waive the security gate; rerun it and native compilation on the new head.

## Verification

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- ESLint: package.json lint arguments via `node node_modules/eslint/bin/eslint.js`
  passed with zero warnings.
- Focused tests: `node scripts/run-tests.mjs src/workout src/generator src/backup`
  passed, 15 files / 138 tests. Additional final repository budget regression:
  `node scripts/run-tests.mjs src/workout/DexieWorkoutRepository.test.ts`,
  1 file / 30 tests passed.
- `node node_modules/@playwright/test/cli.js test`: 40/40 passed at 360×800 and
  412×915. Includes subtraction, reload, no overflow, offline recovery, update
  safety and unchanged completed-set behavior. Artifacts are under
  artifacts/playwright/test-results.
- Web: build.mjs, bundle-report.mjs and smoke-pages.mjs passed.
- Android web: build-android.mjs and smoke-android.mjs passed.
- Audits: project, architecture, Android release, network, language,
  accessibility, performance, assets, exercise-assets, dependencies and licenses
  passed. Existing legacy direct-table-access warning remains (41 files).
- Initial JS 658,027 bytes; lazy reviewed data and asset budgets pass. Vite's
  generic >500 kB chunk warning remains; enforced repository budgets pass.
- A global test attempt was interrupted after slow imports and one home-control
  assertion failure. The unchanged home tests passed in isolation (2/2).
  The complete suite is being rerun alone; final result recorded below.

## Limits and rollback

Estimates are not a stopwatch measurement of each repetition: they measure time
between consecutive logged working sets, subtracting recorded recovery. Very
long waits are excluded; shorter preparation waits can influence the estimate.
Unknown exercises retain standard pace. No warm-up or recovery policy is changed.
No physical Pixel was connected: mobile evidence is Chromium, not a device claim.

Revert this source commit to roll back behavior; optional timing data is ignored
by older code and existing user history remains intact. Published APK updates
must keep the existing signing identity and a higher CI versionCode. A phone ZIP
must contain the signed release APK, never source code or a debug installation.
