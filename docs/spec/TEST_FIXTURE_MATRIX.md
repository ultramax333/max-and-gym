# Test fixture matrix

All fixtures are synthetic and contain no real personal data.

| Fixture | Purpose |
|---|---|
| `empty-install` | first boot/onboarding |
| `legacy-repquest-minimal` | smallest supported RepQuest schema |
| `legacy-repquest-history` | exercises, sessions, sets, body metrics |
| `active-workout-start` | active session before any set |
| `active-workout-mid` | completed sets and running rest |
| `active-workout-corrupt-timer` | timer owner mismatch |
| `multiple-active-sessions` | invariant detection/repair |
| `duplicate-operation` | idempotency detection |
| `program-2x40` | duration/generator |
| `program-2x60` | duration/generator |
| `program-3x40` | duration/generator |
| `program-3x60` | duration/generator |
| `core-10` | transition/duration |
| `core-15` | transition/duration |
| `all-hard-exclusions` | generator/substitution filter |
| `reviewed-exercise-library` | search/filter/offline media |
| `unreviewed-exercises` | eligibility rejection |
| `custom-exercise-image` | local Blob and backup |
| `body-measurements` | CRUD/chart/export |
| `photos-small` | normal photo pipeline |
| `photos-large` | quota/compression |
| `orphan-photo-blob` | integrity detection |
| `valid-backup-full` | Replace/Merge/round trip |
| `backup-bad-checksum` | safe rejection |
| `backup-path-traversal` | archive security |
| `backup-future-version` | compatibility rejection |
| `diagnostic-sensitive-values` | redaction leak test |
| `service-worker-waiting` | update deferral |
| `unexpected-network-origin` | audit failure |

Each fixture has:

- creation script;
- schema/version label;
- expected counts;
- expected invariants;
- allowed use;
- no real names/notes/media.
