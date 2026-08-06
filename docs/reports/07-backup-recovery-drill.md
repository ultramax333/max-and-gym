# CP7 backup and recovery drill

## Format and scope

The personal backup is a versioned `.maxgym` ZIP archive. It contains a manifest, structured table data and external media entries for progress photos, thumbnails and custom-exercise images. The manifest records schema/export versions, table and media counts, byte sizes and SHA-256 checksums.

The ZIP reader is dependency-free and defensive: it validates central-directory structure, CRC-32, entry counts, expanded-size limits and safe relative paths. Compressed, encrypted, absolute, traversal, backslash and unsupported entries are rejected before database writes.

## Recovery drill

| Scenario | Expected result | Verified result |
|---|---|---|
| Export complete dataset | tables, measurement, photo, thumbnail and custom image represented with counts/checksums | Pass |
| Clear then Replace import | restored records and binary media match source checksums | Pass |
| Merge identical archive | stable-key records deduplicated | Pass |
| Merge conflict | preview identifies conflict; caller chooses reject, keep-current or use-imported | Pass |
| Corrupt checksum/ZIP | archive rejected before mutation | Pass |
| Future export version | archive rejected before mutation | Pass |
| Unsafe archive path | entry rejected by ZIP parser | Pass |
| Insufficient storage estimate | import rejected before transaction | Pass |
| Post-import missing photo media | integrity check fails inside transaction and rolls back | Pass |

## Transaction and rollback controls

- Every import begins with a read-only preview of versions, paths, checksums, counts, media references and conflicts.
- Storage availability is checked before committing.
- A pre-import safety snapshot is persisted separately from the imported dataset.
- Replace and Merge writes run in one Dexie transaction.
- Post-import photo/media integrity is checked before that transaction commits.
- Rejection paths were asserted to leave table counts unchanged.
- A successful export updates `lastBackupAt`; the backup screen also shows estimated local storage usage/quota.
- Browser verification built and downloaded a real `.maxgym` archive and updated the last-backup timestamp.

Decision: complete backup survives clear/Replace restore, photos and custom images round-trip, Merge is explicit, and invalid or oversized imports cannot partially mutate user data.
