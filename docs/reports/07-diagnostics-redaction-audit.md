# CP7 diagnostics and redaction audit

## Diagnostic coverage

The diagnostics screen now exposes build identity, database/export versions, seed and generator identities, service-worker and storage status, database/session recovery state, platform capabilities, a non-destructive self-test and a separate diagnostic export.

The self-test checks:

- database opening and the 28-table schema;
- referential integrity of sets, programs and photo media;
- at most one active session and valid timer ownership;
- uniqueness of critical operation identifiers;
- a temporary diagnostic write/read/delete cycle;
- a no-bytes backup preflight;
- generator exclusions, determinism and provenance when its catalog is seeded;
- build and seed identities;
- service-worker/cache health, absence of cached user media and unexpected runtime origins.

## Non-destructive evidence

- The healthy fixture verifies record counts before and after the self-test.
- Failure fixtures detect multiple active sessions, orphan sets, duplicate completion operation IDs, invalid timer ownership and orphan photo media.
- The production-browser run reported no failures. Three warnings were expected because the isolated browser profile had not seeded the generator exercise catalog; all other checks passed.

## Export allowlist and redaction

The diagnostic archive is separate from the personal `.maxgym` backup and is restricted to these categories:

1. build identity;
2. environment capabilities;
3. database health and counts;
4. PWA health;
5. storage health;
6. self-test results;
7. redacted diagnostic events;
8. network origins;
9. feature status.

It exports technical counts and allowlisted status fields, never table records or media bytes. Event messages are normalized/redacted and entity routes are reduced to technical route shapes.

The leak test seeds a secret note, a distinctive body measurement, a custom exercise name, a distinctive training load and secret photo bytes/checksum, then asserts that none appears in any diagnostic ZIP entry.

## Retention and privacy result

- Diagnostic retention/version tests pass.
- No training load, repetition, body measurement, personal note, custom name, photo, binary payload or media checksum is included.
- Network audit reports no prohibited runtime origin.
- User-media cache inspection reports zero matches.

Decision: the diagnostic package isolates technical failures without carrying personal values and meets `DIA-020` through `DIA-022`.
