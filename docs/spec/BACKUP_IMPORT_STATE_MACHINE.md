# Backup and import state machines

## Personal backup

```text
IDLE
  → PREFLIGHT
  → SNAPSHOT
  → ARCHIVE_BUILD
  → ARCHIVE_VALIDATE
  → DOWNLOAD_READY
  → COMPLETED
```

Any failure:

```text
... → FAILED
```

Failure does not modify user data. Record safe error code and stage.

## Import

```text
IDLE
  → FILE_READ
  → MANIFEST_VALIDATE
  → CHECKSUM_VALIDATE
  → DATA_SCHEMA_VALIDATE
  → STORAGE_ESTIMATE
  → PREVIEW
  → SAFETY_SNAPSHOT
  → STAGE
  → COMMIT
  → POSTCHECK
  → COMPLETED
```

Failure before COMMIT: discard stage, no current-data change.

Failure during/after COMMIT:

- rollback transaction/staging swap;
- retain safety snapshot;
- show recovery;
- record error ID;
- do not partially claim success.

## Replace semantics

- imported compatible settings/data become current;
- source installation ID is not used as authentication;
- current data remains in safety snapshot until postcheck succeeds.

## Merge semantics

- stable identical IDs deduplicate;
- materially different same-ID records become conflict;
- sessions/media are never silently overwritten;
- user selects conflict policy;
- settings merge uses explicit rules;
- result is previewed and postchecked.

## Archive safety

Reject:

- path traversal;
- absolute paths;
- symlinks;
- unsupported compression/path;
- unexpected executable content;
- missing manifest;
- checksum mismatch;
- decompressed size beyond cap;
- too many files;
- future unsupported version.

## Diagnostic export

Diagnostic export has a separate state machine and never uses personal backup data tables directly. It builds from allow-listed technical summaries.
