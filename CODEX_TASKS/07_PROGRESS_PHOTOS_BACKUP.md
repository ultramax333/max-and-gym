# Task 07 — Progress, photos, backup, and complete diagnostics

## Prerequisite

CP6 accepted.

## Objective

Complete personal history, body tracking, local progress photos, full backup/restore, and the final diagnostics/self-test system.


## Owned requirement IDs

`PRO-001`, `PRO-002`, `PRO-003`, `PRO-004`, `PRO-005`, `PRO-006`, `PRO-007`, `PRO-008`, `BKP-001`, `BKP-002`, `BKP-003`, `BKP-004`, `BKP-005`, `BKP-006`, `DIA-020`, `DIA-021`, `DIA-022`.

## Progress

Implement:

- workout history;
- exercise history;
- raw-set view;
- personal records;
- estimated one-repetition-maximum trend with clear estimated label;
- weekly/monthly frequency;
- sets/volume/duration;
- movement/muscle distribution;
- chart text summaries.

## Measurements

- weight;
- waist;
- chest;
- hips;
- upper arm;
- thigh;
- custom metric;
- add/edit/delete/history/chart;
- metric units.

## Photos

Pipeline:

1. select camera/gallery file;
2. validate MIME/size;
3. decode;
4. correct orientation when possible;
5. resize to maximum dimension;
6. re-encode WebP, JPEG fallback;
7. create thumbnail;
8. reduce metadata through re-encoding;
9. calculate checksum;
10. store Blob and metadata transactionally;
11. revoke temporary object URLs.

UI:

- front/side/back/custom;
- date/optional weight/note;
- grid;
- optional blurred thumbnails;
- side-by-side comparison;
- delete;
- storage cost.

No upload and no service-worker caching.

## Personal backup

Implement `.maxgym`:

- manifest;
- versioned structured data;
- photos and custom exercise images;
- checksums;
- counts;
- preflight;
- archive post-validation;
- last-backup timestamp.

## Import

- preview before write;
- schema/checksum/path/size validation;
- storage estimate;
- Replace;
- Merge;
- pre-import safety snapshot;
- staging/transaction;
- post-import integrity;
- rollback on failure.

## Diagnostics completion

Implement full `docs/spec/DIAGNOSTICS_AND_AUDIT.md`:

- all Diagnostics cards;
- complete non-destructive self-test;
- invariant checks;
- cache/media checks;
- backup dry run;
- generator hard-exclusion/determinism sample;
- separate redacted diagnostic ZIP;
- sensitive-data leak tests.

## Tests

- chart calculations;
- records;
- measurement CRUD;
- Android photo orientation/compression;
- Blob cleanup;
- quota error;
- no user-media cache;
- backup round trip;
- clear/restore;
- Merge conflicts;
- corrupt/malicious archive;
- insufficient storage;
- self-test pass/fail fixtures;
- diagnostic retention/redaction/export.

## Deliverables

- `docs/reports/07-photo-storage-audit.md`;
- `docs/reports/07-backup-recovery-drill.md`;
- `docs/reports/07-diagnostics-redaction-audit.md`;
- `docs/reports/07-cp7-checkpoint.md`.

## CP7 exit gate

- complete backup survives clear/restore;
- photos round-trip;
- corrupt import changes nothing;
- no media/network/privacy leak;
- diagnostic package isolates failures without personal values;
- CP7 report accepted.

Open one pull request and stop.
