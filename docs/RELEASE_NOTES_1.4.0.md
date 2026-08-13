# Max & Gym 1.4.0 release notes

Date: release candidate prepared 2026-08-13. Production publication follows acceptance and merge of the release pull request.

## Highlights

- complete visual redesign using the existing dark, performance-focused identity;
- clearer Home and Train hubs with stronger next-session and quick-action hierarchy;
- modernized workout generator with a mobile-first session summary, exercise preview and replacement flow;
- modernized active-workout experience with clearer progress, current exercise, set navigation and recovery state;
- redesigned Programs, Library, Progress, Settings, Tools, History, Diagnostics and onboarding surfaces;
- consistent cards, fields, buttons, dialogs, tabs, feedback, focus states and safe-area-aware navigation across the application;
- responsive layouts verified on Pixel 9a dimensions and a compact 360 × 800 viewport.

## Identity and compatibility

- application: `1.4.0`;
- database schema: `8` (unchanged);
- personal export format: `2` (unchanged);
- exercise seed: `fedb-b0eed061e1c8-reviewed-4` (unchanged);
- program seed: `maxgym-seed-programs-v1` (unchanged);
- generator: `deterministic-v5` (unchanged);
- service-worker cache: `5` (unchanged).

No data migration is introduced by this release. Existing workouts, history, exercise preferences, saved programs, progress data and `.maxgym` backups remain compatible. The Android application ID and release-signing identity are unchanged, so the signed APK can update an existing compatible installation in place.

## Verification

- TypeScript and scoped ESLint passed with zero warnings;
- 47 unit/component test files and 185 tests passed;
- production PWA build and GitHub Pages subpath smoke passed;
- generator and accessibility journeys passed at 412 × 915;
- expanded visual-route tests passed at 360 × 800 and 412 × 915;
- project, architecture, Android, network, licence, asset, language, accessibility and performance audits are included in the release gate;
- the trusted `master` workflow builds and verifies the signed APK before creating the matching `v1.4.0` GitHub Release.

## Known limitations

- exercise entries without reviewed local media continue to show an explicit no-photo state;
- dense legacy workout editors keep their established information architecture while inheriting the new global theme and controls;
- browser wake lock, vibration, notifications and persistent storage remain best-effort platform capabilities;
- Android background alarms depend on the installed native APK and device notification permissions; the web version cannot guarantee the same background behavior;
- the exercise catalogue and application bundles remain intentionally sizeable because reviewed local exercise data and media are packaged for offline use.

## Before updating

Export a current `.maxgym` backup and keep it outside the app before installing the update. Install the signed APK over the existing app; do not uninstall first, because uninstalling removes Android-private local data.

## Fixed error codes

No diagnostic error code was added, removed or redefined in this visual release.

## Privacy, sources and licences

No backend, analytics, advertising, remote font, external visual asset, donor code, second UI framework or production dependency was added. Material UI and the existing reviewed local assets remain the implementation and media sources. Runtime network-origin policy is unchanged.

## Recovery

Because the database and export schemas are unchanged, the visual commits can be reverted without a data migration. If a production correction is required after publication, issue a new semantic version and higher Android `versionCode`; do not replace the immutable signed release asset.
