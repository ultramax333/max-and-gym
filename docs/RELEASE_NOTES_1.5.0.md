# Max & Gym 1.5.0 release notes

Date: release candidate prepared 2026-08-14. Production publication follows acceptance and merge of the release pull request.

## Highlights

- expands the focused Glutes session pool with Barbell Hip Thrust and Step-up with Knee Raise;
- recognizes the existing Monster Walk and Thigh Abductor records as useful glute alternatives;
- increases the Glutes replacement pool while deliberately rejecting stretches, unsupported equipment, jumping variants and redundant bridge or squat variations;
- bundles two reviewed local images for every newly added exercise, preserving complete offline use.

## Identity and compatibility

- application: `1.5.0`;
- database schema: `8` (unchanged);
- personal export format: `2` (unchanged);
- exercise seed: `fedb-b0eed061e1c8-reviewed-5` (updated);
- program seed: `maxgym-seed-programs-v1` (unchanged);
- generator: `deterministic-v5` (unchanged);
- service-worker cache: `5` (unchanged).

The reviewed catalogue contains 302 exercises, of which 273 are generator-eligible. Existing workouts, history, exercise preferences, saved programs, progress data and `.maxgym` backups remain compatible. The seed refresh preserves the user override layer and does not overwrite personal exercise preferences.

## Verification

- catalogue generation and all 604 local exercise images are audited;
- the focused Glutes pool and all replacement candidates are covered by automated tests;
- the complete quality, production-build, GitHub Pages, browser and Android release gates run for this release candidate;
- the trusted `master` workflow builds and verifies the signed APK before creating the matching `v1.5.0` GitHub Release.

## Known limitations

- the Glutes pool remains intentionally finite: records without supported equipment, two usable local images or a distinct training purpose remain excluded;
- browser wake lock, vibration, notifications and persistent storage remain best-effort platform capabilities;
- Android background alarms require the installed native APK and the appropriate device permissions;
- the application remains sizeable because reviewed exercise data and media are packaged for offline use.

## Before updating

Export a current `.maxgym` backup and keep it outside the app before installing the update. Install the signed APK over the existing app; do not uninstall first, because uninstalling removes Android-private local data.

## Fixed error codes

No diagnostic error code was added, removed or redefined in this release.

## Privacy, sources and licences

No backend, analytics, advertising, remote font, second UI framework or production dependency was added. The two new exercises and four images come from the repository-pinned Free Exercise DB revision `b0eed061e1c8` under the existing Unlicense provenance record. Runtime network-origin policy is unchanged.

## Recovery

No database or export migration is introduced. If a production correction is required after publication, issue a new semantic version and higher Android `versionCode`; do not replace the signed release asset.
