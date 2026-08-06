# CP7 photo and storage audit

## Scope

This audit covers `PRO-006` through `PRO-008`: local progress-photo ingestion, storage, display, comparison, deletion and failure handling. No upload or remote media service is used.

## Pipeline controls

| Stage | Control | Evidence |
|---|---|---|
| Selection | Camera/gallery input accepts JPEG, PNG and WebP only; source size is capped at 20 MB | `photoPipeline.ts`; invalid and oversized fixture tests |
| Decode/orientation | `createImageBitmap` requests `imageOrientation: from-image`; the decoder remains injectable for Android/orientation fixtures | `photoPipeline.test.ts` |
| Resize | Longest dimension is bounded to 2048 px; thumbnail longest dimension is 320 px | pipeline unit tests |
| Re-encode | WebP is preferred and JPEG is the explicit fallback | fallback test |
| Metadata reduction | Re-encoding creates new image bytes rather than preserving source metadata | pipeline implementation and checksum assertions |
| Integrity | SHA-256 checksums are calculated for full image and thumbnail | pipeline and backup round-trip tests |
| Persistence | image blob, thumbnail blob and photo metadata are committed in one Dexie transaction | `PhotoRepository.test.ts` |
| Cleanup | preview/comparison object URLs are explicitly revoked on replacement and unmount | object-URL cleanup test and browser inspection |

## Storage and privacy

- Full images and thumbnails live in IndexedDB `mediaBlob`; metadata lives in `progressPhoto`.
- Service-worker rules never cache user media; diagnostics inspect cache request names and report user-media matches.
- The UI states that processing is local and exposes current photo storage cost.
- Thumbnail blur is optional, labelled for assistive technology, and does not alter the stored original.
- Comparison is limited to matching poses and renders two local object URLs side by side.
- Delete removes both metadata and referenced blobs transactionally.
- A simulated quota error leaves no orphan metadata or blob and returns the stable `PHOTO_STORAGE_QUOTA` code with backup/storage recovery actions in the UI.

## Verification result

- Android orientation/decoder fixture: pass.
- resize, WebP/JPEG fallback, checksum and MIME/size rejection: pass.
- blob persistence/delete and URL revocation: pass.
- quota/no-orphan failure path: pass.
- production-browser accessibility check: `Flouter la miniature` is exposed as a named checkbox; camera/gallery, pose, date, optional weight and optional note are labelled.

Decision: the local photo pipeline and storage controls satisfy the CP7 photo acceptance criteria.
