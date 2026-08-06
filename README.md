# Max & Gym

Max & Gym is a local-first workout Progressive Web App designed for Android Chrome. Workouts, programs, measurements, progress photos, backups and diagnostics stay in the browser's IndexedDB; the version-1 core has no backend, account requirement, telemetry or third-party runtime request.

## Version 1 scope

- manual and deterministic two- or three-day programs;
- resilient active workouts, persisted rest timers, summaries and progression proposals;
- reviewed exercise library with local two-position images;
- measurements, workout history and private local progress photos;
- complete checksummed `.maxgym` backup/import and separate redacted diagnostic export;
- installable PWA, prompted/deferred updates and offline operation after the first online load.

Training suggestions are organizational aids, not medical or coaching advice. Stop when something hurts and consult a qualified professional when appropriate.

## Run locally

Requirements: Node 24 and npm 11, as pinned by `.nvmrc`, `package.json` and `package-lock.json`.

```sh
npm ci
npm start
```

Open `http://localhost:3000/max-and-gym/`. The production build and release gates are:

```sh
npm run quality
npm run build
npm run test:release
```

The build is written to `build/` and is configured for the GitHub Pages subpath `/max-and-gym/`.

## Data safety

Browser storage can be removed by the operating system, browser cleanup, private browsing, origin/domain changes or device loss. Export a `.maxgym` backup after meaningful changes and before an application or hosting-origin change. A Replace import is destructive only after preview and confirmation; Merge reports conflicts first.

See [User guide](docs/USER_GUIDE.md), [version 1 release notes](docs/RELEASE_NOTES_1.0.0.md), [deployment specification](docs/spec/DEPLOYMENT.md), and [release checklist](docs/reports/08-release-checklist.md).

## Architecture and privacy

- React 18, TypeScript, Vite and Material UI;
- Dexie over IndexedDB;
- HashRouter for GitHub Pages compatibility;
- generated service worker through `vite-plugin-pwa`;
- no server, sync, advertising, analytics or remote font dependency.

Source, licence pins and third-party notices are recorded in `SOURCE_PINS.json`, `THIRD_PARTY_CODE_MAP.md`, `THIRD_PARTY_NOTICES.md` and `COPYING`.

## Licence

Max & Gym is distributed under GPL-3.0-or-later and retains the notices required by its RepQuest foundation and other sources. See [COPYING](COPYING) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
