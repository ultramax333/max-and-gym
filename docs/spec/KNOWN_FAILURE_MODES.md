# Known failure modes and required controls

## FM-01 — Blank page on GitHub Pages

Likely causes:

- incorrect Vite base;
- history routing without fallback;
- stale service worker;
- asset path beginning at root;
- uncaught boot/database error.

Controls:

- hash router;
- subpath production test;
- root error boundary;
- build identity;
- service-worker reset diagnostics;
- Playwright test against production build under `/max-and-gym/`.

## FM-02 — Route works locally but returns 404 after deployment

Controls:

- hash routing;
- deployed-route smoke tests;
- no assumption of server rewrites.

## FM-03 — New deployment still shows old UI

Likely cause: waiting/stale service worker or cache mismatch.

Controls:

- prompt update;
- visible build ID;
- waiting-worker state;
- cache version;
- update diagnostics;
- never force update during active workout.

## FM-04 — Data appears missing after repository/domain rename

IndexedDB is scoped to origin.

Controls:

- do not rename production origin casually;
- document origin in release process;
- export backup before origin change;
- provide import path on new origin.

## FM-05 — Browser/operating-system storage cleanup deletes data

Controls:

- request persistent storage;
- explain limits;
- backup reminders;
- storage status;
- complete export/restore test.

## FM-06 — Migration loops or runs twice

Controls:

- migration journal;
- explicit versions;
- idempotent application guard;
- postcheck;
- restart test.

## FM-07 — Migration silently erases records

Controls:

- no destructive reset;
- prior-version fixtures;
- count/relationship checks;
- pre-migration safety path;
- failure recovery screen.

## FM-08 — Double tap creates duplicate set

Controls:

- disable busy action;
- unique operation ID;
- transaction;
- unique index/guard;
- duplicate-operation test.

## FM-09 — UI shows completed set but database save failed

Controls:

- transactional command;
- explicit pending state;
- rollback/retry;
- no permanent completed styling until commit;
- diagnostic event.

## FM-10 — Rest timer drifts in background

Controls:

- persisted `endsAt`;
- reconcile on visibility/focus;
- fake-clock tests;
- never use interval count as truth.

## FM-11 — Timer alarm does not fire after Android kills process

This is a platform limitation for a normal PWA. The Android APK corrects it with a native alarm projection; the web build remains best-effort.

Controls:

- do not promise guaranteed background alarms;
- recover correct timer on reopen;
- best-effort audio/vibration/notification;
- clear UI copy;
- APK schedules the persisted deadline with Android `AlarmManager` after the database commit;
- exact-alarm and notification permission states remain visible and non-blocking;
- native cancellation mirrors pause, skip, undo, finish and abandon;
- physical Pixel acceptance covers background, lock-screen and process-recreation behavior.

## FM-12 — Active workout is lost on reload

Controls:

- persist session before navigating;
- auto-save actions;
- boot recovery;
- end-to-end reload/kill tests;
- one-active-session invariant.

## FM-13 — Duplicate active workouts

Controls:

- transactional start;
- invariant query;
- existing-session resume prompt;
- conflict repair and diagnostics.

## FM-14 — Exercise images fail offline

Likely causes:

- hotlinked media;
- wrong GitHub Pages path;
- unbounded/incorrect runtime cache.

Controls:

- local bundled reviewed assets;
- generated path test;
- offline media test;
- asset integrity report.

## FM-15 — Progress photos enter service-worker cache

Controls:

- Blob storage only;
- no HTTP photo route;
- cache allowlist;
- cache audit.

## FM-16 — Photo object URLs leak memory

Controls:

- revoke on unmount/replacement;
- component tests;
- avoid retaining full images in React state.

## FM-17 — Storage quota exceeded

Controls:

- compress photos;
- usage/quota display;
- warning threshold;
- transactional save;
- backup/delete guidance;
- quota failure test.

## FM-18 — Corrupt import overwrites current data

Controls:

- parse/validate before write;
- checksums;
- staging or transaction;
- pre-import snapshot;
- postcheck;
- rollback.

## FM-19 — Backup manifest exists but media is missing

Controls:

- referential preflight;
- per-file checksums;
- archive post-validation;
- round-trip tests.

## FM-20 — Generator emits blocked movement

Controls:

- hard filter before scoring;
- post-generation validator;
- substitution/warm-up/conditioning use the same constraint service;
- property tests across many seeds.

## FM-21 — Regenerate accessories changes locked main lift

Controls:

- protected identifiers;
- generator diff test;
- explicit unlock action;
- explanation snapshot.

## FM-22 — Duration label is unrealistic

Controls:

- calculate sets, execution, rest, warm-up, setup, and transitions;
- do not shorten heavy rest to fit;
- duration tolerance tests;
- show breakdown.

## FM-23 — Same input produces different program unexpectedly

Controls:

- seeded deterministic generator;
- sort candidate inputs;
- store generator version and seed;
- determinism test.

## FM-24 — Material UI and donor framework styles conflict

Controls:

- one UI system;
- no Tailwind/shadcn/Radix production dependency;
- reimplement donor patterns;
- dependency audit.

## FM-25 — Bundle grows from donor imports

Controls:

- isolated imports;
- route/media lazy loading;
- bundle report;
- checkpoint regression threshold;
- reject large dependency for one component.

## FM-26 — Accessibility regression in custom component

Controls:

- prefer Material UI semantics;
- automated accessibility test;
- keyboard test;
- focus review;
- screen-reader labels.

## FM-27 — Unexpected analytics/tracking request

Controls:

- remove Sentry and Alceris;
- scan source/build;
- network-origin allowlist test;
- no remote fonts/scripts.

## FM-28 — MIT/GPL notice omitted

Controls:

- third-party map;
- notice test;
- pull-request provenance section;
- release licence audit.

## FM-29 — Error cannot be matched to deployed code

Controls:

- visible build/Git identity;
- stable error ID;
- diagnostic export;
- checkpoint tags.

## FM-30 — Diagnostic export leaks personal values

Controls:

- allow-list fields, not block-list;
- redaction unit tests;
- fixture leak scan;
- explicit preview of included categories.

## FM-31 — Seed update overwrites user edits

Controls:

- separate seed and user fields;
- source revision;
- user override layer;
- seed migration tests.

## FM-32 — Historical workout changes after program edit

Controls:

- session snapshots;
- immutable completed records;
- no live template lookup for historical display.

## FM-33 — One-repetition-maximum record is misleading

Controls:

- label as estimated;
- one documented formula;
- confidence warning at high repetitions;
- retain raw set source.

## FM-34 — Bug fix introduces unrelated redesign

Controls:

- one issue/task per pull request;
- changed-file scope review;
- checkpoint gate;
- no unsolicited scope expansion.

## FM-35 — Legacy orientation script crushes desktop layout

Likely cause: JavaScript rotates the entire document from `screen.orientation.angle`, which can disagree with the responsive viewport and accessibility zoom state.

Controls:

- no document-level rotation or zoom mutation;
- CSS responsive layout only;
- mobile and desktop screenshots at CP1;
- route-boundary visual check at 1440 × 900.

CP1 status: reproduced during Diagnostics verification and removed before checkpoint evidence was captured.

## CP3 control status

- FM-03: durable active-workout marker now defers an update.
- FM-08 and FM-09: operation IDs, transactional commits, busy UI and rollback tests
  cover duplicate or uncertain set writes.
- FM-10: rest truth is a persisted end timestamp and is reconciled on focus/boot.
- FM-11: best-effort vibration/wake lock is implemented; physical Android
  background-kill evidence remains deferred.
- FM-12 and FM-13: schema-backed recovery and the one-active invariant are tested.
- FM-32: the CP3 session stores exercise name and prescription snapshots.

## CP4 control status

- FM-14: reviewed images are embedded locally, source-pinned and checked for missing
  paths; the PWA cache is bounded and only serves local exercise media.
- FM-24 and FM-25: the library continues to use Material UI only; the media cache is
  bounded to avoid precaching the full 24 MB source image set.
- FM-31: source seed, user preference and custom exercise records are separated, so a
  seed refresh does not overwrite user choices.
