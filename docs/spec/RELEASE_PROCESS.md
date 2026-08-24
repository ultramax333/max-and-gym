# Release process

## 1. Versioning

Use semantic application versions:

- patch: compatible bug fix;
- minor: compatible user-visible feature;
- major: intentionally incompatible product/export change.

Database, export, seed, generator, and cache versions remain independent integers/identifiers.

## 2. Checkpoint tags

After an accepted and merged checkpoint:

```text
checkpoint/cp0
checkpoint/cp1
...
checkpoint/cp8
```

Release candidates:

```text
v1.0.0-rc.1
```

Production:

```text
v1.0.0
```

## 3. Release candidate freeze

After CP7:

- no new feature;
- only defects, accessibility, performance, documentation, licence, and release work;
- schema changes require explicit release-blocker justification;
- update seed data only for blocking correctness/licence issues.

## 4. Release checklist

- all acceptance tests mapped and passing;
- no open release-blocking defect;
- clean production build;
- app/build/Git versions correct;
- GitHub Pages subpath test;
- Android install/offline/update matrix;
- migration fixtures pass;
- backup clear/restore drill;
- diagnostic redaction test;
- network-origin audit;
- licence/provenance audit;
- asset report;
- accessibility review;
- bundle/performance report;
- release notes;
- rollback/forward-recovery note;
- production smoke plan.

## 5. Release notes format

- version and date;
- major user changes;
- database/export/seed/generator/cache changes;
- migration notes;
- known limitations;
- backup recommendation;
- fixed error codes;
- source/licence changes.

## 6. Post-release verification

Within the production deployment:

- verify displayed SHA/tag;
- run diagnostics self-test;
- install/launch Android;
- start/resume/finish controlled workout;
- switch offline and relaunch;
- export a test backup;
- verify no unexpected network request;
- verify update behavior from prior release where possible.

## 7. Hotfix

For a data/reliability hotfix:

1. branch from release;
2. reproduce with failing test;
3. avoid unrelated changes;
4. run affected checkpoint plus full release blockers;
5. update error/known-failure documentation;
6. release patch;
7. verify service-worker upgrade path.

## 8. End-of-support for old formats

Do not remove an import or migration reader until:

- the supported window is documented;
- representative fixtures exist;
- Max has a current complete backup;
- replacement/recovery path is tested;
- a release note announces removal.

## 9. Android package identity and signing

- `versionName` is read from the root `package.json`; it must remain identical to the displayed application version.
- CI derives `versionCode` from the stable `ANDROID_VERSION_CODE_FLOOR` plus the Android workflow `GITHUB_RUN_NUMBER`. The floor must never be lowered and the workflow identity must not be replaced without first selecting a higher floor.
- Pull requests and fix branches publish a debug APK for installation testing. Debug APKs are not production update artifacts.
- A signed release APK is built only by the trusted `master` workflow, and only when all four repository secrets exist: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, and `ANDROID_STORE_PASSWORD`. Feature branches and pull requests never reference signing secrets.
- The release keystore is decoded only into the ephemeral runner directory. Keystores and credentials must never enter Git or build artifacts.
- CI verifies the release signature with Android `apksigner` before uploading the APK.
- Preserve the signing key and credentials in an independently backed-up secret store. Losing or changing the key prevents in-place updates of an installed release.
- A partially configured signing secret set fails the workflow; an entirely absent set safely skips the release APK while retaining the debug artifact.
- Attach the signed APK to the matching GitHub Release without renaming it. Its required name is `max-and-gym-v<versionName>-<versionCode>-release.apk`; the in-app checker rejects missing, duplicate, malformed or downgrade assets.
- Attach a companion `max-and-gym-v<versionName>-<versionCode>-release-apk.zip` containing exactly that signed APK so phone browsers can download an archive. The in-app updater continues to select only the `.apk` asset.
- The GitHub release tag is exactly `v<versionName>`. Drafts and prereleases are never offered by the installed application.
- The trusted `master` workflow creates the exact version tag at the built commit, then creates the GitHub Release and attaches the signed, versioned APK. CI keeps an existing release immutable and refuses an orphaned/ambiguous tag; a correction requires a new semantic version and a higher `versionCode`.
- Keep the Android `applicationId` equal to `io.github.ultramax333.maxandgym` and retain the same signing certificate. Android enforces both identity and signature during an in-place update and rejects a non-increasing `versionCode`.
- Enable immutable GitHub Releases when repository settings permit it. The app reports when GitHub does not mark a release immutable; Android signature verification remains mandatory in either case.

## 10. Manual Android update policy

- The Android app never checks, downloads or installs an update in the background. The user initiates each check from Settings → About and updates.
- The only metadata request is an unauthenticated `GET` to `https://api.github.com/repos/ultramax333/max-and-gym/releases/latest`, using GitHub's versioned REST API ([official endpoint documentation](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)).
- The only accepted download URL begins with `https://github.com/ultramax333/max-and-gym/releases/download/` and names the exact versioned release APK.
- The metadata check sends no token, cookie, account, analytics identifier, workout value or local database content. GitHub still receives normal network metadata such as the device IP address; the external browser may separately use its own GitHub session when it opens the download.
- An active or paused workout and any started workout, backup or import write defer both checking and opening the download.
- Opening a download requires a second in-app confirmation. The installed app delegates the transfer to Android DownloadManager, shows durable byte progress, verifies size, SHA-256, package identity, version and signer, then opens Android's installation confirmation.
- The app does not request silent-install or unknown-package installation privileges. Never uninstall the existing app as part of an update because that would remove its private local data.

## 11. Pull-request merge approval

- Codex opens the pull request, reports its checks and head commit, then stops.
- Once all required checks pass, Codex may ask the project owner whether to merge that specific pull request and commit.
- Only a fresh explicit approval replying to that merge request authorizes the merge. A standing permission, an earlier generic `Go`, or approval issued before the request is invalid.
- The approval is bound to the reported pull-request head. If the head changes or a required check fails, Codex must resolve the state and ask again.
- Codex must not merge a draft pull request, a pull request with pending or failing required checks, or a pull request whose mergeability is uncertain.
- After an approved merge, Codex may monitor the documented deployment and release workflows and report their results. It must not begin unrelated product work automatically.
