# Debugging playbook

## 1. Never begin with data deletion

Do not advise clearing site data, uninstalling, deleting IndexedDB, or resetting the database until:

- diagnostic export exists;
- personal backup exists when the app can produce one;
- failure class is understood;
- a recovery path is documented.

## 2. First capture

Collect:

- visible error ID;
- app version and Git SHA;
- database/export/seed/generator/cache versions;
- current route;
- online/offline state;
- installed PWA or tab;
- exact steps;
- expected/observed result;
- self-test summary;
- diagnostic export.

## 3. Triage decision tree

### Blank screen before UI

Inspect:

1. build asset/base path;
2. router;
3. service worker/cache;
4. boot error boundary;
5. database open/migration.

### UI loads but data is missing

Inspect:

1. production origin changed;
2. database name changed;
3. migration status;
4. filters/status;
5. import/merge result;
6. storage eviction.

### Set/timer failure

Inspect:

1. operation journal;
2. duplicate operation;
3. transaction abort;
4. active-session invariant;
5. timer ownership;
6. visibility/timestamp reconciliation.

### Generated program wrong

Inspect:

1. normalized input;
2. hard exclusion result;
3. candidate score;
4. generator version/seed;
5. duration breakdown;
6. post-generation validation.

### Photo/storage failure

Inspect:

1. MIME/decode;
2. orientation/re-encode;
3. byte size;
4. quota;
5. transaction;
6. Blob references;
7. object URL lifecycle.

### Backup/import failure

Inspect:

1. manifest version;
2. checksum;
3. archive paths;
4. schema validation;
5. quota;
6. staging transaction;
7. postcheck;
8. rollback.

## 4. Reproduction ladder

1. Current user environment, without changing data.
2. Clean browser profile with anonymous fixture.
3. Production build locally served under GitHub Pages subpath.
4. Service worker disabled.
5. Offline/online comparison.
6. Last accepted checkpoint tag.
7. Commit bisect.

The first level at which behavior differs narrows the subsystem.

## 5. Regression test first

For deterministic failures:

- create the smallest anonymous fixture;
- add a failing unit/component/end-to-end test;
- confirm failure on bad commit;
- confirm pass on last good checkpoint;
- implement minimal fix;
- keep test permanently.

## 6. Database recovery

Recovery order:

1. read-only diagnostics;
2. export personal backup if possible;
3. copy/stage database;
4. run integrity analysis;
5. forward repair/migration;
6. verify;
7. only then remove irreparable orphan data with explicit report.

No generic `db.delete()` repair.

## 7. Service-worker recovery

- identify active/waiting worker and cache version;
- compare build identity;
- test with worker disabled in a separate profile;
- use controlled unregister/cache cleanup action that does not remove IndexedDB;
- reload;
- record diagnostic event.

Do not conflate clearing cache with clearing site data.

## 8. Bug-fix evidence

Every fix report includes:

- root cause;
- why existing tests missed it;
- new failing test;
- code change;
- data compatibility;
- cache/update effect;
- rollback/forward recovery;
- affected error code;
- known-failure update.
