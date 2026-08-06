# Max & Gym 1.0.0 release notes

Date: release candidate prepared 2026-08-07. Production publication date remains pending CP8 external acceptance.

## Highlights

- local-first Android-oriented workout PWA with no backend or telemetry;
- resilient active workout, persisted timers, refresh/reopen recovery and idempotent set completion;
- manual and deterministic program generation for the supported two-/three-day and 40-/60-minute combinations;
- reviewed local exercise catalogue and seed media;
- progress history, measurements and private local progress photos;
- complete checksummed `.maxgym` backup/import plus a separately redacted diagnostic export;
- prompted PWA updates that defer during an active workout;
- route-level code splitting and a 68.9% reduction in initial JavaScript from the CP7 baseline.

## Identity and compatibility

- application: `1.0.0`;
- database schema: `8`;
- personal export format: `2`;
- exercise seed: `fedb-b0eed061e1c8-reviewed-1`;
- program seed: `maxgym-seed-programs-v1`;
- generator: `deterministic-v1`;
- service-worker cache: `2`.

Schemas 2 through 7 have migration fixtures into schema 8. Future/unsupported database and export versions are rejected without silent deletion. Because migrations are forward-only, prefer a forward recovery release to a source rollback after schema 8 has opened.

## Privacy, security and licences

Representative browser use contacted only the serving origin. No Sentry, analytics, advertising, remote font, photo upload or personal-media cache path is present. Installed dependency licence metadata has no unknown or restricted entry, and source provenance is complete.

The dependency gate contains one user-approved, expiring exception for `GHSA-qwww-vcr4-c8h2` in React Router 7.18.2. The advisory affects React Router's server/RSC action protocol; this static HashRouter SPA ships none of those packages or APIs. The gate scans for that surface and continues to block every other high or critical registry finding. The exception expires 2026-10-01.

## Known limitations

- Android physical-device install, camera/gallery, background capability and vibration/sound checks remain platform verification items before final production acceptance;
- GitHub Pages deployment, production SHA/tag identity, old-cache upgrade from the deployed build and production smoke have not been executed from this local workspace;
- browser wake lock, vibration, notifications and persistent storage are best-effort capabilities;
- some inherited and newer screens do not yet provide complete bilingual copy; English remains the configured release default;
- the initial JavaScript is 659,633 bytes minified and the reviewed exercise-data chunk is 866,252 bytes; both pass the CP8 budgets but Vite still emits its generic 500 kB warning.

## Before updating

Export a current `.maxgym` backup and keep it outside browser storage. Do not clear site data to apply an ordinary service-worker update.
