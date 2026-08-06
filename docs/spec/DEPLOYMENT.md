# Deployment specification

## 1. Target

Static GitHub Pages project site:

```text
https://<github-user>.github.io/max-and-gym/
```

Routes use a hash by default.

## 2. Environments

### Local development

- development server;
- isolated development database name;
- no production service worker unless specifically testing it;
- anonymous fixtures only.

### Pull-request preview artifact

GitHub Actions builds the production artifact and serves it in end-to-end tests under a project subpath. A separate hosted preview is optional, not required.

### Production

- default branch;
- GitHub Actions Pages deployment;
- production database name/origin;
- no secrets;
- no external runtime service.

## 3. Required GitHub workflows

### `quality.yml`

On pull request and push:

- checkout;
- configure pinned Node;
- clean install;
- typecheck;
- lint;
- architecture audit;
- unit/component tests;
- migration tests;
- production build;
- bundle report;
- network-origin scan;
- licence/provenance scan;
- upload reports.

### `e2e.yml`

On pull request or manual:

- production build under `/max-and-gym/`;
- Playwright;
- offline tests;
- accessibility;
- screenshots;
- upload traces on failure.

### `deploy-pages.yml`

On successful default-branch gate:

- build once with production identity;
- upload Pages artifact;
- deploy;
- post-deploy smoke;
- record URL/build SHA.

Do not rebuild a different artifact after quality verification if avoidable.

### Optional scheduled `audit.yml`

- dependency audit;
- asset/source-link integrity;
- exercise-source drift report;
- no automatic dependency merge.

## 4. Vite configuration requirements

- correct `base`;
- deterministic build metadata;
- hashed assets;
- source maps policy documented;
- route chunks;
- bundle analysis;
- no accidental environment secrets;
- production origin allowlist.

## 5. Progressive Web App deployment

- manifest paths honor base;
- service-worker scope honors base;
- prompt update;
- cache names include cache version;
- old cache cleanup;
- no progress-photo/user-media caching;
- offline fallback;
- update action disabled/deferred during critical write or active workout.

## 6. Database and deployment compatibility

Before deployment with schema change:

- migration tests pass;
- compatibility/rollback note exists;
- backup warning behavior defined;
- build and schema versions increment correctly;
- prior deployed build behavior against new schema is documented.

A code rollback may be unsafe after forward-only migration. Prefer a forward recovery release when required.

## 7. Production smoke

After deploy:

1. load fresh profile;
2. load existing profile fixture in controlled browser;
3. verify build identity;
4. verify service worker;
5. verify hash route;
6. start/complete sample set;
7. reload/resume;
8. offline launch;
9. diagnostics self-test;
10. no unexpected network origin.

Do not use real user data in automated production smoke.

## 8. Origin stability

IndexedDB is origin-specific. Changing GitHub username, repository slug, Pages domain, protocol, or custom domain creates a different storage origin/path context.

Before any production-origin change:

- export complete backup;
- document old/new URL;
- test import on new origin;
- keep old origin accessible until restore is verified.

## 9. Rollback

Keep:

- last known-good tag;
- last known-good Pages artifact when feasible;
- database compatibility note;
- emergency forward-fix procedure;
- cache recovery instructions.

A rollback checklist includes service-worker/cache behavior, not only source code.

## 10. Secrets and configuration

Version 1 requires no runtime secrets. Any request to add a secret indicates scope/architecture drift and requires a new Architecture Decision Record.
