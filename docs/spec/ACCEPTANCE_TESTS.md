# Acceptance tests

All priority-zero tests are release blocking.

## A. Build, deployment, and identity

### AT-A01 — Reproducible build

Given a fresh checkout at a checkpoint commit, when the documented runtime and clean lockfile install are used, then type check, lint, tests, and production build complete without undocumented manual steps.

### AT-A02 — GitHub Pages subpath

Given the production build is served under `/max-and-gym/`, then the shell, assets, hash routes, and reload flow work without 404 or blank page.

### AT-A03 — Build identity

Settings → Diagnostics shows app version, Git SHA, build time, database version, export version, seed version, generator version, and cache version matching the deployed artifact.

## B. Privacy and network

### AT-B01 — No telemetry

Representative production use produces no request to Sentry, Alceris, analytics, remote font, advertisement, or unapproved third-party origin.

### AT-B02 — Local photos

Adding, viewing, comparing, backing up, and deleting a photo produces no upload request and no service-worker cache entry containing the photo.

### AT-B03 — Diagnostic redaction

A diagnostic export generated from fixtures containing notes, loads, repetitions, measurements, custom names, and photos contains none of those sensitive values or binary media.

## C. Progressive Web App

### AT-C01 — Installable Android experience

The production site has valid manifest/icons and can be installed or gives correct current Chrome installation instructions.

### AT-C02 — Offline shell

After one successful online load, Home, active workout, Programs, reviewed Exercises/media, Progress from local data, Settings, Diagnostics, and backup export work with network blocked.

### AT-C03 — Update during workout

When a new service worker is waiting during an active workout, the app shows a deferred update and does not reload until the user finishes or explicitly confirms a safe pause/update path.

### AT-C04 — Old cache recovery

After deploying a new checkpoint build, the user can identify current/waiting versions and apply the update without clearing all browser data.

## D. Onboarding and settings

### AT-D01 — Defaults

Onboarding defaults to English, Advanced, Metric, Full Gym, three days, 60 minutes, 15-minute core, mixed goals, dark theme, and all hard exclusions active.

The user may choose two days or 40 minutes before completion.

### AT-D02 — Capability denial

Denied/unavailable wake lock, vibration, audio, notifications, or persistent storage never blocks a workout and results in accurate non-repeating guidance.

## E. Active workout

### AT-E01 — Start/resume

From Home, a planned workout starts within three taps. An existing active workout is resumed rather than duplicated.

### AT-E02 — Idempotent set completion

A double tap, UI retry, or repeated operation identifier results in exactly one completed set.

### AT-E03 — Failed set write

When the database transaction is forced to fail, the UI does not leave the set permanently completed, prior data is unchanged, Retry is available, and a stable error ID is recorded.

### AT-E04 — Rest timer recovery

A 180-second rest backgrounded for approximately 90 seconds restores from the persisted end timestamp with correct remaining time within test tolerance.

### AT-E05 — Process-kill expectation

The UI does not claim a guaranteed alarm after Android kills the process. Reopening restores correct elapsed/remaining state.

### AT-E06 — Refresh recovery

After several completed sets, refresh or browser closure restores the same active workout, current position, completed state, and timer without duplicates.

### AT-E07 — Finish

Finishing commits one completed session, stops active timer, releases wake lock, shows persisted summary, and creates pending progression proposals without changing the program.

### AT-E08 — Undo

Undo reverts the intended recent action exactly once and survives refresh.

### AT-E09 — Substitution

Alternatives exclude blocked items, explain match, preserve original and actual exercise, and do not delete prior logged sets.

### AT-E10 — Superset

Superset progression and group rest are correct, with no generated rapid floor-to-standing sequence.

## F. Exercise library

### AT-F01 — Reviewed eligibility

Only reviewed/custom eligible exercises can be automatically selected. Imported-unreviewed records cannot enter generated programs.

### AT-F02 — Local media

All reviewed seed exercises used by starter programs show start/end images online and offline under the GitHub Pages subpath.

### AT-F03 — Never Suggest

Setting an exercise to Never Suggest excludes it from generation, alternatives, warm-ups, and conditioning immediately, without hiding its history.

### AT-F04 — Custom exercise

A custom exercise with one local image persists across reload and is included in personal backup.

### AT-F05 — Source and licence

Each seeded exercise record has source revision and licence traceability; the curation audit reports no blocking missing metadata.

## G. Programs and generator

### AT-G01 — Manual program

The user can create, edit, reorder, group, duplicate, activate, and archive a two- or three-day program without changing completed-session history.

### AT-G02 — Duration estimate

Estimate includes warm-up, ramp sets, execution, rest, setup, transitions, and conditioning. Primary rest is not silently shortened to hit the target.

### AT-G03 — Two-day 40

Generated A/B sessions cover required weekly movement patterns, use valid equipment, and estimate 36–44 minutes.

### AT-G04 — Two-day 60

Generated A/B sessions meet goal blend and estimate 54–66 minutes.

### AT-G05 — Three-day 40

Generated A/B/C sessions distribute stress and estimate 36–44 minutes each.

### AT-G06 — Three-day 60

Generated A/B/C sessions distribute strength/hypertrophy/conditioning and estimate 54–66 minutes each.

### AT-G07 — Core 10/15

Core sessions estimate 9–11 and 13.5–16.5 minutes respectively and contain no rapid floor-to-standing transition.

### AT-G08 — Hard exclusions

Across at least 100 representative seeds/settings, no blocked exercise/tag appears anywhere in program, substitution, warm-up, core, or conditioning.

### AT-G09 — Determinism

Identical normalized input, data revision, generator version, and seed produce identical output and explanation.

### AT-G10 — Locked main exercise

Regenerating accessories does not change a locked main exercise or its prescription.

### AT-G11 — Progression confirmation

No proposal mutates the active program before Accept. Reject leaves it unchanged. Edit applies only the confirmed edited proposal.

### AT-G12 — Discomfort hold

An exercise-associated discomfort entry prevents an automatic increase proposal until the user explicitly overrides or resolves it.

## H. Progress and photos

### AT-H01 — Exercise history

Exercise progress shows raw history, records, estimated-max trend with an estimated label, and a text summary.

### AT-H02 — Measurements

Metric measurements save, edit, delete, chart, export, and restore offline.

### AT-H03 — Photo processing

A large Android photo is orientation-corrected when possible, resized, re-encoded, thumbnail-created, metadata-reduced, and stored as Blob.

### AT-H04 — Photo comparison

Two same-pose photos compare side by side offline; blur setting is respected; temporary object URLs are released.

### AT-H05 — Quota failure

A forced quota error leaves no orphan metadata/blob and shows backup/storage actions with a stable error ID.

## I. Backup/import

### AT-I01 — Complete export

A backup with workouts, programs, measurements, custom exercise image, and photos has valid manifest, checksums, record counts, and all referenced media.

### AT-I02 — Clear and restore

After deleting all local data, Replace import restores equivalent records and visible media.

### AT-I03 — Merge

Merge does not duplicate identical stable records and reports conflicts before choosing a resolution.

### AT-I04 — Invalid archive

Corrupt, unsupported, oversized, path-traversal, or checksum-failing archives make no change to current data.

### AT-I05 — Insufficient storage

Import detects insufficient estimated capacity before commit and keeps existing data intact.

## J. Diagnostics and audit

### AT-J01 — Self-test

On a healthy database, self-test passes required checks without modifying real records.

### AT-J02 — Invariant detection

Fixtures with duplicate operation IDs, orphan media, invalid timer ownership, or multiple active sessions produce the expected failed checks and stable codes.

### AT-J03 — Audit artifacts

`audit:project` generates machine-readable and Markdown reports containing build, dependencies, architecture, database, PWA, network, licences, assets, tests, and checkpoint readiness.

### AT-J04 — Error isolation

An induced workout transaction failure can be traced from visible error ID to diagnostic event, build identity, subsystem, failing test, and checkpoint regression range.

### AT-J05 — Bounded log

Diagnostic event retention never exceeds 1000 events or 30 days after pruning.

## K. Accessibility and UI

### AT-K01 — Phone use

At 360 × 800 and 412 × 915, critical workout content has no horizontal overflow and primary actions are comfortably reachable.

### AT-K02 — Touch targets

Primary workout targets are at least 48 × 48 CSS pixels where practical.

### AT-K03 — Keyboard/focus

All non-camera functions work with keyboard; focus is visible; dialogs/sheets restore focus; reorder has buttons.

### AT-K04 — Contrast/reduced motion

Level-AA contrast is met, status is not colour-only, and reduced motion removes nonessential animation.

### AT-K05 — One UI system

Production dependency and bundle audit finds Material UI as the sole component system and no Tailwind/shadcn/Radix/DaisyUI donor stack.

## L. Database migration

### AT-L01 — Prior schema

A fixture from each supported prior schema migrates once, preserves required records/relationships, and opens normally on restart.

### AT-L02 — Failed migration

An induced migration failure displays recovery, records safe diagnostics, and does not silently delete the database.

### AT-L03 — Historical immutability

Editing/deleting/archive of live programs/exercises does not alter completed workout snapshots.

## M. Flexible active sessions

### AT-M01 — Equipment grouping and preview

Generated exercises with the same primary equipment are contiguous. In an active workout, every plan exercise opens its local photos and technique without changing the current exercise or losing progress.

### AT-M02 — Variable working sets

Supported quick-session durations produce coherent prescriptions containing two to five working sets according to goal and role; generation is not fixed to three sets.

### AT-M03 — Contextual rating

The same exercise can retain independent 1–5 ratings for glutes/hypertrophy, back/hypertrophy and back/strength. Only the exact matching context affects a future generation.

### AT-M04 — Safe set trade

Adding a current working set removes exactly one untouched future working set, keeps the total planned set count and duration target unchanged, is idempotent on retry, and refuses safely when no donor can retain at least two working sets.
