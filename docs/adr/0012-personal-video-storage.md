# ADR 0012 — Stream personal video copies to private device storage

- Status: Accepted for the owner-requested personal video library.
- Date: 2026-11-03.

## Context and decision

The owner imports videos in batches, classifies them by one or more body areas,
and records a subjective difficulty from 1 to 5, mainly for abs/core. Personal
videos are not catalogue exercise assets, generated prescriptions or APK content.

Use an additive appMeta key, localWorkoutVideos:v1, for validated metadata. Use a
dedicated origin-private file-system directory for video copies, with UUID-only
storage keys and bounded 1 MB asynchronous writes. This is a deliberate
large-video exception to the IndexedDB Blob policy for small photo media.
No dependency, backend, server upload, third-party player or service-worker video
cache is added. Unsupported storage/codec states remain explicit.

Files are committed before metadata. Failed commits clean up the new copy;
reattachment creates a new asset before replacing the reference. A failed media
deletion restores its metadata so the user can retry. Originals outside the app
are never overwritten or deleted. A hard process kill between file and metadata
commits may leave an unreferenced private copy; no automatic broad file deletion
is performed.

## Backup and compatibility

The existing .maxgym serializer includes the metadata key, preserving titles,
areas, durations and difficulty. It deliberately excludes the large OPFS files
and keeps its 64 MB bounded archive implementation. Both library and backup UI
must disclose this limitation. The manifest carries the same warning. After
restoring on another device, absent files are labelled unavailable and can be
reattached without losing classification. The original files on the owner's PC
are the separate media backup; there is no implicit PC-to-phone sync.

Schema 8/export 2/cache 9 remain unchanged. Old builds ignore the metadata key;
there is no destructive migration. Browser/app-data clearing or uninstall removes
the private copies, just as it removes other local app data. Preserve the origin,
application ID and release signing key during updates.

## Verification and exclusions

Use synthetic videos only. Test real browser file selection, OPFS copy, reload,
offline playback, editing, combined filtering, deletion confirmation, missing
files after restore, reattachment, quota/commit errors, cancellation and native
Back routing. Physical Pixel codec/installer behavior remains a manual check.
Do not transcode, analyse video content, automatically assign difficulty, upload
videos, ship personal footage in Git/APK, or modify the training generator.
