# Max & Gym 1.12.0 — personal equipment and reliable workout media

Release candidate date: 2026-09-22.

## Changes

- Correct exercise equipment, choose the primary grouping station and mark
  equipment that is difficult to access or needs two stations.
- Personal equipment corrections now affect library filters, session generation,
  alternatives and new workout snapshots.
- Choose a NonStop Gym location and use a clearly labelled local crowd estimate;
  temporary quiet/busy observations apply only to the current generator visit.
- Open the same equipment editor from the active exercise or an upcoming
  exercise without changing completed sets or silently reordering the session.
- Show custom local exercise photos in the library, generator and workout, with
  a full-screen enlargement action and safe Blob URL cleanup.
- Explain failed equipment saves and allow a retry without closing the editor.
- Debounce library searches and ignore obsolete asynchronous results.
- Keep web updates waiting until every tab is closed; an active workout or
  critical write blocks update instructions, and no tab is force-reloaded.

## Identity and compatibility

- App version: `1.12.0`
- Database schema: `8` (unchanged)
- Export format: `2` (unchanged)
- Exercise seed: `fedb-b0eed061e1c8-reviewed-8` (unchanged)
- Generator: `deterministic-v14`
- Cache: `9` (unchanged)

Existing workouts, history, exercise preferences, programs, photos and
`.maxgym` backups remain compatible. No personal data is uploaded and no
database migration is introduced.

The signed APK keeps application ID `io.github.ultramax333.maxandgym` and the
existing release certificate, so it can update a compatible installation in
place. Android still requires confirmation when installing from the browser.

## Verification

- TypeScript, lint, unit/component/migration tests and production build pass.
- 287 automated unit/component/migration tests pass.
- 40 Chromium mobile journeys pass at 360 × 800 and 412 × 915, including
  offline recovery, local media, recoverable equipment saves and web-update
  safety during an active draft.
- Project, dependency, licence, architecture, Android, network, accessibility,
  performance, language, asset and exercise-media audits pass.

Back up personal data before updating. GitHub Releases are immutable: a later
correction must use a newer semantic version and Android versionCode.
