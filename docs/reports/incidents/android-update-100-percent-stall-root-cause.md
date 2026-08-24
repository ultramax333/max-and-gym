# Incident Android update 100 percent stall — root-cause report

## Summary

- Reported at: 2026-08-23
- Investigation mode: FIX (`Go` authorization)
- Correction Git SHA: `c264acbe75456cab26b8f06f27bd42ac61640863`
- Last known good release: `v1.8.0`
- Affected environment: installed Android application on Pixel 9a
- Visible error ID: none
- Severity: high usability / no identified data-loss risk
- Status: correction implemented; physical Pixel 9a acceptance pending

## User-visible symptom

### Expected

After the user confirms an update, Android shows useful download progress, verifies the completed APK, and opens the system installer. If the installer cannot open, the application exposes a clear retry action and durable reason.

### Observed

The download can reach 100 percent without a visible transition to verification or installation. The update action then appears inert or unavailable.

### Exact reproduction steps

1. Open Settings → About and updates in an older installed release.
2. Check for an update and confirm the APK download.
3. Allow the download to reach 100 percent.
4. Observe that the application has no durable progress phase or detailed failure reason for the copy/verification/installer hand-off.

## Evidence preserved

- Diagnostic export: not supplied
- Build/continuous-integration logs: v1.8.0 signed APK and production workflow passed
- Screenshots: earlier phone evidence in the project conversation
- Synthetic fixture: component launcher mock
- Personal backup confirmed: not applicable; the update flow does not edit IndexedDB

## Classification

- First failing subsystem: native Android update state projection
- Downstream symptoms: apparently frozen 100-percent download and unavailable installer action
- Affected route/feature: Settings → About and updates
- Affected schema/export/seed/generator/cache version: none

## Reproduction matrix

| Environment | Result | Evidence |
|---|---|---|
| Existing profile | Independent of profile data | Update code does not read workout values |
| Clean profile with synthetic fixture | Reproduced at UI boundary | Launcher status lacks a durable phase |
| Installed Android app | Affected | Native plugin owns the download |
| Browser tab | Not affected by native flow | Native card is hidden |
| Online | Required for download | GitHub release URL |
| Offline | Explicit download failure expected | DownloadManager state |
| Service worker bypassed | Unchanged | APK download is native |
| Last known good checkpoint | No reliable native phase model | Source inspection |
| Current checkpoint | Reproduced by regression test | `AndroidUpdateCard.test.tsx` |

## Proven facts

1. `AndroidUpdatePlugin.getUpdateStatus` exposes only `staged` and `downloading` booleans, not DownloadManager status, bytes, percentage, staging or failure reason.
2. The plugin copies the completed download into private storage before installation but catches every staging exception without recording its class or durable status.
3. The UI ignores the `downloading` boolean on boot and reacts only to transient `ready` and `failed` events, so a completed event can be missed across lifecycle changes.
4. The release API already supplies APK size and SHA-256 digest, but the native launcher currently receives only the URL and verifies neither.
5. Android validates the signing certificate during installation, but the application does not preflight package name, version or signer before presenting the installer.

## Supported inferences

1. A DownloadManager transfer can be complete while the application is copying or opening the APK; the UI presents this as an undifferentiated download state.
2. A lifecycle transition or silent copy error can leave the user with neither a meaningful error nor a durable install-ready state.

## Remaining hypotheses

1. The original phone event may also include a device-specific package-installer or unknown-source permission state; physical Pixel 9a verification remains required after installing the correction.

## Hypotheses excluded

1. IndexedDB, workout data and service-worker cache are not on the native APK download path.
2. The v1.8.0 release asset exists, is signed, has a monotonic version code and passed CI signature verification.

## Regression range

- First bad commit: not isolated; the issue is an incomplete state model rather than a newly identified regression
- Comparison/bisect method: source and lifecycle-path inspection
- Relevant diff: native update plugin and Android update card

## Root cause

The native updater treats download, staging, verification and installer launch as one mostly transient operation. Its persisted state is insufficient, staging exceptions are swallowed, and the web UI has no byte progress or durable phase reconciliation. Consequently, completion at the DownloadManager layer is not reliably projected into a visible verification, ready or failed state.

## Requirement and risk impact

- Requirement IDs: AT-A01, AT-C04, FM-38
- Data-loss risk: none identified
- Migration risk: none
- Cache/update risk: APK update availability only; IndexedDB remains untouched
- Safety/privacy impact: no personal data leaves the device
- Licence/provenance impact: none

## Failing automated test

- Test path: `src/androidUpdate/AndroidUpdateCard.test.tsx`
- Failure before correction: the component does not display the native staging phase after a 100-percent download
- Why it reproduces the defect: it models lifecycle reconciliation after DownloadManager completes but before installer readiness

## Minimum correction

Persist and expose an explicit native phase with byte progress and safe failure reason; verify expected size, SHA-256, application ID, version and signer before staging; reconcile status on mount/resume; keep a manual installer retry; and publish a ZIP companion automatically without changing the APK used by the in-app updater.

## Alternatives rejected

| Alternative | Why rejected |
|---|---|
| Continue opening the public browser download | No reliable callback or application-owned progress |
| Silently retry forever | Hides failure and can waste network/battery |
| Uninstall before installing | Deletes private local data and breaks update identity |
| Add a backend updater | Violates local-first scope |

## Recovery and rollback

- Existing affected data: unchanged
- Forward recovery: retry the native update or download the signed release APK manually
- Rollback: restore the v1.8 updater; no data rollback required
- User action required: Android installation confirmation remains mandatory

## Verification

| Command/test | Result | Evidence |
|---|---|---|
| Targeted component regression | Passed, 12 tests | `AndroidUpdateCard.test.tsx` and update-service tests |
| TypeScript and ESLint | Passed | Local checkpoint, zero lint warnings |
| Android audit, Capacitor sync and Gradle compile/test | Passed | GitHub Actions run `32771558363`, job `97572838642` |
| Web/Android production builds and smoke checks | Passed | Local checkpoint |
| Physical Pixel 9a update hand-off | Pending | Requires installing v1.8.1 over an older signed build |

## New diagnostic coverage

- Error code: `ANDROID_UPDATE_DOWNLOAD_FAILED`, `ANDROID_UPDATE_VERIFICATION_FAILED`
- Safe diagnostic context: phase, reason code, byte counts, expected/actual version code
- Redaction test: diagnostic allow-list gate

## Known failure-mode update

- New FM identifier: FM-38

## Final verdict

- Root cause proven at the application lifecycle boundary; device-specific installer behavior remains for physical acceptance
- Fix implemented and Android compilation verified in GitHub Actions
- Release remains gated on pull-request quality checks and explicit merge authorization
