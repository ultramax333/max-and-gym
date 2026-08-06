# Task 04 — Reviewed local exercise library

## Prerequisite

CP3 accepted.

## Objective

Build a high-quality, local, offline exercise library and media pipeline without unverified videos or runtime hotlinks.


## Owned requirement IDs

`EXR-001`, `EXR-002`, `EXR-003`, `EXR-004`, `EXR-005`, `EXR-006`, `EXR-007`, `EXR-008`, `EXR-009`, `EXR-010`, `EXR-011`, `EXR-012`, `EXR-013`, `EXR-014`.

## Source pin

Pin an immutable Free Exercise DB revision and record it in the source-pin file and notices.

## Pipeline

Implement a repeatable development pipeline:

1. read pinned source JSON;
2. apply curated allowlist;
3. apply max&gym overrides;
4. normalize identifiers/tags;
5. validate schema;
6. detect duplicates/near duplicates;
7. add movement, position, transition, impact, and setup tags;
8. process local images;
9. emit reviewed seed dataset;
10. emit curation report and source map.

Do not fetch source data or images at application runtime.

## Content scope

First, review every exercise required by seed programs and common alternatives. Then expand toward 150–220 high-value exercises.

Only `reviewed` or user-created eligible exercises may be generated.

## Media

- local start/end images;
- optimized thumbnail/detail sizes;
- stable paths under GitHub Pages base;
- lazy loading;
- bounded seed-media cache;
- no user media in service-worker cache;
- no version-1 video.

## UI

- Library list/grid;
- search;
- full-screen mobile filters;
- movement/equipment/muscle/position/status filters;
- favourite;
- Never Suggest;
- exercise detail;
- instructions/cues/mistakes;
- alternatives;
- history placeholder/integration;
- source/licence;
- custom exercise with one local image.

## Data migration

Map existing RepQuest exercises/history to stable identifiers without orphaning historical sets. Use alias/source mapping where needed.

## Tests

- schema;
- duplicate detection;
- source/licence presence;
- hard tags;
- generator eligibility;
- broken paths;
- image dimensions/size;
- GitHub Pages base;
- offline images;
- custom image persistence;
- seed update preserves user overrides/history;
- Never Suggest propagation.

## Audits

- curation report;
- asset report;
- licence/source audit;
- offline media audit;
- bundle/cache report.

## Deliverables

- `docs/reports/04-exercise-curation-report.md`;
- `docs/reports/04-media-asset-audit.md`;
- `docs/reports/04-cp4-checkpoint.md`;
- updated source pins/notices.

## CP4 exit gate

- starter-program exercises complete/reviewed;
- automatic eligibility restricted;
- local images work offline;
- no broken source/licence item;
- historical references preserved;
- CP4 report accepted.

Open one pull request and stop.
