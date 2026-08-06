# CP3 checkpoint — dependable workout vertical slice

Date: 2026-08-06

Status: ready for local review; physical Android evidence deferred

Branch: task/03-workout-vertical-slice

## Exit gate

- [x] Local start/resume, complete set, rest, finish and summary flow.
- [x] Additive schema 4 migration preserves legacy tables and data.
- [x] Repository/application-service boundary; no direct Dexie calls in the new UI.
- [x] One-active invariant and idempotent critical operations.
- [x] Exact position and timer recovery after production-build route refresh.
- [x] Offline end-to-end automated journey.
- [x] Failed transaction path leaves no partial set or operation.
- [x] Waiting PWA update uses the durable active-workout marker.
- [x] Critical failure codes and local diagnostic journaling.
- [ ] Physical Android Chrome install, background-kill and alarm evidence.

## Evidence

- docs/reports/03-workout-current-state-audit.md
- docs/reports/03-workout-reliability-audit.md
- docs/reports/screenshots/03-active-workout-412x915.jpg
- docs/reports/screenshots/03-summary-412x915.jpg

## Local-only continuation

The user authorized local work without a personal Git identity, fork or GitHub
credentials. No push or pull request is claimed. The physical Android item is
explicitly deferred rather than reported as passed.
