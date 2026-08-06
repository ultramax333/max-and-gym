# Task 00 — network, privacy, and licence audit

- RepQuest pin: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Workout.cool pin: `e3dcd23b4ebdfb6254010b9a7c350cfef9e236c8`
- Verdict: baseline is not compliant with the max&gym runtime-origin policy

## Runtime origin inventory

| Origin/pattern | Trigger | Data/risk | Decision |
|---|---|---|---|
| `https://alceris.com/script.js` | unconditional `index.html` script | analytics code loads on every page | Remove in CP1 |
| configured `*.ingest.sentry.io` | `VITE_SENTRY_ENABLED=true` and telemetry not disabled | errors, traces, offline queue | Remove Sentry and queue in CP1 |
| configured `*.supabase.co` | `VITE_SUPABASE_ENABLED=true` | account/auth requests | Remove client, routes, and envs in CP1 |
| `raw.githubusercontent.com/yuhonas/free-exercise-db/main/...` | exercise import/onboarding and later images | floating remote media dependency | Replace with pinned, reviewed local assets in CP4; block auto-import before then |
| `raw.githubusercontent.com/marcsances/repquest/...` | end-of-life screen image | remote image | Remove EOL route in CP1/CP2 |
| `www.youtube.com/embed/...` | video viewer | third-party iframe/tracking/offline failure | Remove in CP1/CP2 |
| `client.repquest.app` | EOL link | leaves app | Remove EOL route |
| `socis.ponentdnb.com` | cloud login branding/link | unrelated external origin | Remove cloud login |
| Google Forms, GitHub, GNU pages | explicit help/source navigation | user-triggered navigation only | Retain only approved source/licence links |

Browser inspection of the CP0 build directly observed `https://alceris.com/script.js`. The Sentry and Supabase paths were disabled in the local baseline environment but remain reachable through build-time flags.

## Telemetry and logging

- Sentry initialization includes browser tracing at a 0.1 sample rate and an IndexedDB offline transport named `sentry-offline`.
- The error boundary calls `Sentry.captureException` whenever the local telemetry preference is enabled; its logic does not also require the build flag checked by `App.tsx`.
- Multiple pages use raw `console.log`/`console.error` with no central redaction.
- The UI text promises that errors may be sent when connectivity returns.
- Alceris cannot be disabled through the app because its script is unconditional in HTML.

These behaviors violate `SEC-001`, `AT-B01`, and the local-only privacy contract.

## Sensitive-data exposure assessment

No automatic photo upload exists in the baseline. However:

- workout context, current values, personal-best labels, and exercise names are serialized to localStorage as one JSON value;
- raw errors could include record values or browser paths;
- the backup is a complete unencrypted JSON file;
- there is no diagnostic/personal export separation or redaction test;
- Supabase/account code expands the data surface even when disabled.

## Package and vulnerability inventory

Clean installation reports 38 known vulnerabilities: 4 low, 10 moderate, 23 high, and 1 critical. CP0 does not run `npm audit fix` because unreviewed upgrades could change behavior. CP1 must remove unused network packages first, then upgrade the retained stack with build/data tests.

Top-level package licences:

- 49 MIT;
- 5 Apache-2.0;
- 1 Artistic-2.0 (`npm`);
- 1 ISC (`react-geiger`);
- zero unknown among direct dependencies.

Transitive licences still require an automated complete report before release.

## Project licences and provenance

- RepQuest is GPL-3.0-or-later. `COPYING` and per-file notices are present and must remain.
- max&gym therefore remains GPL-3.0-or-later and must publish corresponding source for deployed derivatives.
- Workout.cool is MIT. No code is copied during CP0, so the third-party code map remains empty.
- Free Exercise DB is identified as Unlicense/public-domain dedication, but its immutable dataset commit is intentionally deferred to Task 04. Current use of floating `main` URLs is unacceptable for the final product.
- Workout.cool video/image media is not approved merely because the repository code is MIT-licensed.

## Required actions

1. CP1: remove Alceris, Sentry, Supabase, cloud/account routes, telemetry UI, remote EOL media, and raw production logs.
2. CP1: add a static and dynamic same-origin network allowlist test.
3. CP1: create central stable error codes and allow-list redaction.
4. CP4: pin Free Exercise DB, curate locally, optimize local paired images, and record source/licence metadata.
5. Every checkpoint: scan the built artifact and representative runtime flows for unexpected origins.
