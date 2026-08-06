# CP4 media asset audit

Date: 2026-08-06

## Result

- 360 local JPEG frames: start and end position for each reviewed exercise.
- Total local media size: 24,475,449 bytes.
- Per-file upper limit: 1.5 MB; all audited files pass.
- Asset paths are relative under public/media/exercises and work beneath the
  GitHub Pages base path.
- The production service worker does not precache the full media set. It uses one
  CacheFirst cache, limited to 48 requested local exercise images for 30 days.
- No remote image URL, video or user Blob is included in the service-worker cache.

Generated machine-readable evidence:

- docs/reports/generated/04-curation-summary.json
- docs/reports/generated/04-media-assets.json
- artifacts/audit/exercise-assets.json

Manual browser evidence:

- screenshots/04-library-search-412x915.jpg
- screenshots/04-exercise-detail-412x915.jpg

The exercise detail page rendered both local Goblet Squat positions under the
production GitHub Pages subpath.
