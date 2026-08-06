# Task 00 — baseline environment

- Audit date: 2026-08-06
- Foundation: `https://github.com/marcsances/repquest`
- Immutable base commit: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Base commit date: 2025-10-08 11:53:31 +0200
- Working branch: `task/00-audit-base-donor`
- Host: Windows, PowerShell, Codex workspace sandbox

## Runtime and package state

| Item | Baseline |
|---|---|
| Node | 24.14.0 supplied by the Codex workspace; upstream README says Node 17+ and CI uses Node 18 |
| npm | 11.0.0, installed from the locked project dependency |
| package manager | npm |
| lockfile | `package-lock.json`, lockfile version 3, 950 package entries |
| direct dependencies | 51 production, 5 development |
| source files | 102 TypeScript/TSX/JavaScript/JSX files |
| automated test files | 0 |

The handoff manifest was verified after integration: 88 files checked, zero missing files, and zero SHA-256 mismatches.

## Commands and results

| Command | Result |
|---|---|
| `git clone https://github.com/marcsances/repquest.git max-and-gym` | Pass |
| `npm ci` using npm 11.0.0 | Pass; 703 packages installed, 913 audited |
| `npm ls --depth=0` | Pass; complete top-level dependency tree resolved |
| `npm run build` | TypeScript passed, then Vite's esbuild config loader crashed when the sandbox denied traversal above the workspace |
| Equivalent Vite production build with the same React/PWA options and `configFile: false` | Pass; 13,462 modules transformed and service worker generated |
| Static production smoke at `http://127.0.0.1:3000/` | Pass; HTTP 200 and title `RepQuest` |
| Browser smoke at 360×800, 412×915, and 1440×900 | Pass with visual warnings |

The stock build failure is environment-specific evidence, not hidden: esbuild attempted to read a parent directory unavailable to the sandbox and then panicked. The production graph itself builds successfully when the config object is passed without esbuild loading `vite.config.ts`. Reconfirm the stock command in CI or a normal Node 18/20 checkout during CP1.

## Available package scripts

- `npm start` → Vite development server.
- `npm run build` → `tsc && vite build`.
- `npm run serve` → Vite preview.

There is no `typecheck`, `lint`, `test`, `doctor`, audit, accessibility, offline, or end-to-end command. `src/setupTests.ts` exists, but no test runner script or test file exists.

## Environment variables

| Variable | Purpose | Baseline risk |
|---|---|---|
| `VITE_SUPABASE_ENABLED` | Enables cloud authentication client | Forbidden in max&gym production |
| `VITE_SUPABASE_CLIENT_ID` | Supabase origin | External runtime origin |
| `VITE_SUPABASE_CLIENT_KEY` | Public anonymous client key | Unneeded scope |
| `VITE_SUPABASE_REGISTRATION_ENABLED` | Enables registration UI | Forbidden account feature |
| `VITE_SENTRY_ENABLED` | Enables Sentry | Forbidden telemetry |
| `VITE_SENTRY_DSN` | Sentry destination | External runtime origin |
| `SENTRY_AUTH_TOKEN` | Sentry build upload | Unneeded secret/build network |

## Build and bundle baseline

Production artifact: 111 files and 6,683,843 bytes.

| Asset | Raw bytes | Gzip reported by Vite |
|---|---:|---:|
| `assets/index-d476b1bd.js` | 1,796,339 | 538.25 kB |
| `assets/exercises-accd122b.js` | 846,982 | 159.89 kB |
| `assets/index-7992195b.css` | 24,660 | 11.21 kB |
| PWA precache | 61 entries, 5,995.23 KiB | n/a |

Both JavaScript chunks exceed Vite's 500 kB warning threshold. The main bundle, exercise data, and large set of Apple splash screens are CP1/CP2 optimization targets.

## Dependency and CI findings

- Clean installation reports 38 known vulnerabilities: 4 low, 10 moderate, 23 high, and 1 critical. No automatic fix was applied.
- Several Workbox 6 packages and transitive utilities are deprecated.
- The push workflow masks build failures with `|| true` at `.github/workflows/node.js.yml:39`.
- CI runs only Node 18 and only a build; it does not run lint or tests.
- Top-level package licences resolve to 49 MIT, 5 Apache-2.0, 1 Artistic-2.0, and 1 ISC; no top-level unknown licence was found.

## Screenshot evidence

- `docs/reports/screenshots/00-baseline-360x800.png`
- `docs/reports/screenshots/00-baseline-412x915.png`
- `docs/reports/screenshots/00-baseline-desktop-1440x900.png`

The onboarding page renders at each viewport. Baseline issues include a clipped/fragile lower action area at some heights, a very large decorative mark, and poor use of desktop width.
