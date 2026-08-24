# Max & Gym 1.8.1 — Android update reliability

Release date: 2026-08-23

## Changes

- Shows real Android download progress instead of an indefinite 100-percent state.
- Persists pending, downloading, verifying, ready and failed update phases across page and application lifecycle changes.
- Verifies APK size, GitHub SHA-256 digest, application ID, version code and signing certificate before opening the installer.
- Keeps a verified private APK available through an explicit Install update retry button.
- Publishes a public ZIP containing the signed APK on every future GitHub release.

## Identity and data

- App version: `1.8.1`
- Cache version: `7`
- Database schema: `8` (unchanged)
- Export format: `2` (unchanged)
- Exercise seed and generator versions: unchanged

No workout data is migrated or uploaded. Android still requires the user to confirm installation, and Max & Gym must remain authorized as an unknown-app installation source.
