# Release process

## 1. Versioning

Use semantic application versions:

- patch: compatible bug fix;
- minor: compatible user-visible feature;
- major: intentionally incompatible product/export change.

Database, export, seed, generator, and cache versions remain independent integers/identifiers.

## 2. Checkpoint tags

After an accepted and merged checkpoint:

```text
checkpoint/cp0
checkpoint/cp1
...
checkpoint/cp8
```

Release candidates:

```text
v1.0.0-rc.1
```

Production:

```text
v1.0.0
```

## 3. Release candidate freeze

After CP7:

- no new feature;
- only defects, accessibility, performance, documentation, licence, and release work;
- schema changes require explicit release-blocker justification;
- update seed data only for blocking correctness/licence issues.

## 4. Release checklist

- all acceptance tests mapped and passing;
- no open release-blocking defect;
- clean production build;
- app/build/Git versions correct;
- GitHub Pages subpath test;
- Android install/offline/update matrix;
- migration fixtures pass;
- backup clear/restore drill;
- diagnostic redaction test;
- network-origin audit;
- licence/provenance audit;
- asset report;
- accessibility review;
- bundle/performance report;
- release notes;
- rollback/forward-recovery note;
- production smoke plan.

## 5. Release notes format

- version and date;
- major user changes;
- database/export/seed/generator/cache changes;
- migration notes;
- known limitations;
- backup recommendation;
- fixed error codes;
- source/licence changes.

## 6. Post-release verification

Within the production deployment:

- verify displayed SHA/tag;
- run diagnostics self-test;
- install/launch Android;
- start/resume/finish controlled workout;
- switch offline and relaunch;
- export a test backup;
- verify no unexpected network request;
- verify update behavior from prior release where possible.

## 7. Hotfix

For a data/reliability hotfix:

1. branch from release;
2. reproduce with failing test;
3. avoid unrelated changes;
4. run affected checkpoint plus full release blockers;
5. update error/known-failure documentation;
6. release patch;
7. verify service-worker upgrade path.

## 8. End-of-support for old formats

Do not remove an import or migration reader until:

- the supported window is documented;
- representative fixtures exist;
- Max has a current complete backup;
- replacement/recovery path is tested;
- a release note announces removal.
