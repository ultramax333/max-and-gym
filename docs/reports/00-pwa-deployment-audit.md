# Task 00 — PWA and deployment audit

- Foundation commit: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Current production target in upstream workflow: GitHub Pages
- max&gym target: project subpath `/max-and-gym/`

## Current configuration

| Area | Baseline |
|---|---|
| Router | React Router `HashRouter` |
| Vite base | `/` at `vite.config.ts:23` |
| Build directory | `build` |
| PWA plugin | `vite-plugin-pwa` 0.20.5 |
| Registration | `registerSW({immediate: true})` at `src/App.tsx:44` |
| Update strategy | `registerType: 'autoUpdate'` at `vite.config.ts:28` |
| Workbox | GenerateSW, precaches JS/CSS/HTML/icons/PNG/SVG up to 3 MB |
| Generated precache | 61 entries, about 5.86 MiB |
| Generated service worker | `build/sw.js` and `build/workbox-b03bd2db.js` |

## Manifest and icons

The repository contains both `public/manifest.json` and a generated `manifest.webmanifest`. The Vite manifest identifies RepQuest, uses root-relative icon names, sets portrait/standalone display, and lacks a maskable icon declaration even though `public/logomaskable.png` exists. A large Apple splash-screen set is copied into the build.

Required CP1 changes are one authoritative max&gym manifest, base-aware paths, regular and maskable icons, and validation under the project subpath.

## Update and cache safety

The current auto-update/immediate registration strategy conflicts with the required prompted state machine. There is no check for:

- active workout;
- database migration;
- backup/import commit;
- photo write;
- other critical operation.

The precache pattern includes every PNG below the size cap. Current user photos do not yet exist, but this broad rule would be unsafe once HTTP-served user media appears. max&gym user media must remain IndexedDB Blob-only and explicitly excluded from Workbox routes.

## Offline behavior

The shell, bundled fonts, source code, bundled exercise JSON, and static public assets can be precached. Offline exercise demonstrations are not reliable because onboarding creates `raw.githubusercontent.com/yuhonas/free-exercise-db/main/...` picture URLs. YouTube content and several other remote links are also unavailable offline.

The current active workout can be restored from localStorage, but this is not a reliable offline/session persistence implementation under the product contract.

## GitHub Pages workflow

Positive:

- Actions build and upload a Pages artifact.
- Hash routing avoids direct-route server rewrites.

Blocking findings:

- `base: '/'` will produce root-oriented assets instead of `/max-and-gym/` project-subpath assets.
- The push workflow masks a failed build with `|| true`.
- Node is not pinned outside a matrix label and there is no `.nvmrc`.
- No lint, tests, subpath smoke, offline test, accessibility check, network audit, or build-identity verification runs.
- The deploy job references `${{ steps.deployment.outputs.page_url }}` from a step in another job, which does not provide a valid cross-job output as written.
- Build secrets and telemetry variables are present despite the static/no-secret target.

## Runtime visual smoke

The production artifact returns HTTP 200 and renders onboarding at 360×800, 412×915, and 1440×900. Browser inspection found the external Alceris script plus same-origin application assets. React Router emits two v7 future-flag warnings. Screenshots are under `docs/reports/screenshots/`.

## CP1 actions

1. Change the Vite base to `/max-and-gym/` for production and prove a subpath build.
2. Retain hash routing.
3. Replace auto-update with a waiting/prompt flow and critical-state deferral.
4. Consolidate the manifest and add maskable/regular icon coverage.
5. Remove remote runtime media and telemetry before claiming offline readiness.
6. Add build identity and cache version.
7. Replace the current workflows with strict quality, E2E/subpath, and deploy gates.
