# CP8 Android test matrix

Date: 2026-08-07. No physical Android phone was available in this workspace. Results below distinguish Chromium desktop emulation from required hardware verification.

| Scenario | 360×800 Chromium | 412×915 Chromium | Physical Android/current Chrome |
|---|---|---|---|
| Fresh onboarding/routing | Pass | Pass | Pending external |
| Responsive critical routes/no overflow | Pass | Pass | Pending external |
| Primary touch targets ≥48 px | Pass | Pass | Pending external |
| Active workout/start/set control | Pass | Pass | Pending external |
| Reload/reopen active recovery | Pass | Pass | Pending external |
| Offline launch after SW control | Pass | Pass | Pending external |
| Diagnostics/identity/self-test access | Pass | Pass | Pending external |
| Network-origin isolation | Pass | Pass | Pending external |
| Install prompt/home-screen launch | Manifest only | Manifest only | Pending external |
| Background/foreground 180 s timer | Clock fixture | Clock fixture | Pending external |
| Sound/vibration/wake lock denial and use | Capability fixture | Capability fixture | Pending external |
| Waiting update during active workout | State fixture | State fixture | Pending external |
| Camera/gallery photo orientation | File fixture | File fixture | Pending external |
| Backup download/import via Android picker | Service/unit fixture | Service/unit fixture | Pending external |
| Diagnostic download via Android picker | UI/service fixture | UI/service fixture | Pending external |
| Quota/storage warning | Forced fixture | Forced fixture | Pending external |

## Physical execution protocol

Use anonymized data on the intended production origin. Record phone model, Android version, Chrome version, install source, production URL, build SHA, schema/export/cache identity, battery-optimization state and timestamps. Run online once, install, reload, then repeat critical flows offline. For background timing, record expected/actual remaining seconds after about 90 seconds. For update testing, keep an active workout while a second cache version is deployed and verify that no automatic reload occurs.

Platform limitations must be recorded as limitations, not converted to passes. Wake lock, vibration, notification permission, persistent storage, background scheduling, camera orientation metadata and download UX are browser/device dependent.
