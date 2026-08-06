# Max & Gym 1.0.0 release checklist

## Candidate complete locally

- [x] version set to `1.0.0` in package and lockfile;
- [x] schema/export/seed/generator/cache identities recorded;
- [x] typecheck and zero-warning release lint;
- [x] 82 unit/component/domain/migration tests;
- [x] schema 2–7 migrations and future-schema rejection;
- [x] complete backup Replace/Merge/invalid/storage drill rerun;
- [x] diagnostic redaction and bounded-log tests;
- [x] project/dependency/architecture/network/assets/licence audits;
- [x] strict registry advisory gate with one expiring user-approved exception;
- [x] production build and `/max-and-gym/` smoke;
- [x] 12 Playwright scenarios on 360×800 and 412×915;
- [x] offline active-workout and Diagnostics reload after SW control;
- [x] accessibility and performance budgets;
- [x] README, user guide and release notes;
- [x] CI quality, E2E and single-artifact Pages deployment workflows prepared.

## Required before CP8 acceptance / tag

- [ ] review and accept the language/copy limitation or complete bilingual release copy;
- [ ] run the physical Android matrix and attach device/Chrome evidence;
- [ ] open the release PR and pass GitHub-hosted clean-install workflows;
- [ ] create `v1.0.0-rc.1` only after authorization;
- [ ] deploy the verified Pages artifact;
- [ ] verify production build SHA/schema/export/cache identity;
- [ ] run production fresh/existing-profile smoke with anonymous data;
- [ ] verify old deployed cache to cache 2 update without clearing data;
- [ ] repeat offline launch and network-origin capture on production;
- [ ] accept CP8;
- [ ] create `v1.0.0` only after explicit authorization.

## Rollback / forward recovery

Keep the last known-good artifact and source tag. Because schema migrations are forward-only, do not blindly roll source back after schema 8 opens. Preserve user data, collect a redacted diagnostic export and prefer a forward-fix release. Service-worker recovery must update the cache version and retain IndexedDB; clearing site data is a last-resort destructive recovery and requires a verified external `.maxgym` backup first.
