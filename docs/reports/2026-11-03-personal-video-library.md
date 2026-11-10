# Personal offline video library — v1.15.0 candidate

Date: 2026-11-03. Owner requested batch import, manual body-area classification
and subjective difficulty, mainly for abs/core, then authorized implementation.
Base: c00d0c2 (master v1.14.0, including Claude's equipment/abs/UI changes).
Work is isolated from the owner's dirty original worktree.

## Audit and plan

The existing core page stores YouTube references in appMeta and opens external
links. It cannot import local videos. The existing .maxgym archive is memory
bounded to 64 MB; adding large footage to that serializer would create a new
memory/backup risk. No new actual personal videos were available or requested.

Implement a feature-first localVideos domain/repository/service and a lazy
Material UI route. Preserve the existing YouTube library. Use private OPFS copies
and transactional appMeta metadata, with explicit metadata-only video backups,
safe missing-file reattachment and per-file failure/cancellation. Keep all
existing history, generator behavior, signing and origins unchanged.

Requirements: owner video request, AT-V01/V02/V03, AT-B02/B03, AT-I02/I04,
AT-K01/K02; Task 07 follow-up, not a claim to reaccept the entire CP7 scope.

## Implemented

- Training entries Personal videos and Abs videos; link from Core video classes.
- Multi-file import, at most 100 per batch / 2 GB per file. Each file is checked
  for supported container type and readable video metadata before copying.
- 1 MB asynchronous writes; progress, Stop import, per-file failure summary.
- New videos in To sort, editable title/duration and several body areas.
- Optional 1–5 difficulty, direct editing from filtered lists and player.
- Area/search filters plus optional difficulty/duration filters.
- Native HTML video controls, offline reads, no autoplay, URL cleanup and pause
  on exit. Rating changes preserve the playing media identity.
- Missing-file notice and reattachment preserving classification.
- Confirmed imported-copy deletion; originals outside the app stay unchanged.
- Native Back mapping for library, player and editor.
- Redacted stable diagnostics, never filenames/titles/footage.

## Storage, backup and rollback

ADR 0012 documents the large-video OPFS exception to photo Blob storage.
Metadata is an additive localWorkoutVideos:v1 appMeta entry. Schema 8, export 2,
cache 9 and generator identity stay unchanged. No dependency or network origin
is added; videos are never uploaded, bundled or cached by a service worker.

.maxgym backs up titles, areas, difficulty and durations, not the large files.
The UI and manifest explicitly disclose this. Keep original videos separately,
for example on the owner's PC. Libraries do not automatically sync between PC,
PWA and APK. Restore on another device requires reattaching originals.

Quota/commit/cancel failures preserve existing metadata and files; incomplete
copies are cleaned up. A hard process kill between file and metadata commits may
leave an unreferenced private copy; no broad filesystem cleanup is performed.
Uninstalling or clearing app data removes private files. Update in place only.

Source rollback ignores the additive key/files without deleting them. A native
forward recovery must retain the signing identity and use a higher versionCode.

## Verification

- TypeScript and full zero-warning lint passed during implementation.
- Final focused repository/storage/backup/Back/privacy suite passed:
  7 files / 28 tests, including the global media-identity invariant regression.
- Real browser import/classification/reattachment/deletion/offline playback
  passed at 360×800 and 412×915 (4 tests), including the final filter layout.
- The final focused/browser runs and complete CI are authoritative at the PR
  head; their final results are recorded in the PR verification summary.
- Web production build, Pages subpath smoke, Android web build/smoke passed.
- Project, architecture, network, language, dependency, license, accessibility,
  asset and exercise-classification checks passed; npm registry audit found no
  production advisories. Performance budgets pass (initial JS about 620 kB).
- Existing legacy direct-DB and generic Vite >500 kB chunk warnings remain.

Initial browser attempts exposed test startup synchronization, an editor draft
initialization race and rounding of subsecond synthetic clips. These were fixed:
form controls wait for their loaded draft, and measured duration is preserved
unless explicitly edited. Offline tests await service-worker readiness before
disconnecting. No failed test was disabled or made permissive.

All footage is generated synthetic canvas/MediaRecorder content in isolated test
profiles. No physical Pixel is connected; native picker, codec and fullscreen
behavior still require an on-device acceptance check. Desktop and mobile
screenshots live under artifacts/playwright/test-results.

No donor code or assets are added. File storage uses standard Web APIs, reviewed
against https://web.dev/articles/origin-private-file-system.
