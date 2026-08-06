# Audit automation contract

This document defines the outputs expected from project audit tooling. Codex may choose implementation libraries, but the interface and evidence remain stable.

## 1. Command behavior

### `npm run doctor`

Purpose: inspect local development prerequisites.

Must report:

- Node and npm version;
- operating system;
- clean/dirty Git status;
- current branch and Git SHA;
- lockfile presence;
- installed dependency state;
- required environment variables;
- Vite base;
- database/schema constants;
- service-worker configuration;
- source-pin completeness.

Exit codes:

- 0: ready;
- 1: blocking prerequisite;
- 2: warnings only may still exit 0 if clearly labelled.

Must not modify source, database, or dependencies.

### `npm run audit:project`

Outputs:

- `artifacts/audit/project-audit.json`
- `artifacts/audit/project-audit.md`

Checks:

- project identity;
- dependency versions/licences;
- forbidden packages;
- duplicate UI frameworks;
- architecture boundaries;
- circular dependencies;
- route inventory;
- direct Dexie accesses;
- schema/version definitions;
- migration file/test pairing;
- error-code registry duplicates;
- diagnostic redaction coverage;
- service-worker/cache configuration;
- runtime-origin declarations;
- source pins/provenance;
- bundled asset counts/sizes;
- acceptance-test traceability;
- unresolved risk/blocker count.

### `npm run audit:network`

Static checks:

- URLs in source/config/build;
- remote fonts;
- analytics/tracking scripts;
- fetch/XMLHttpRequest/WebSocket/EventSource;
- image/video hotlinks;
- service-worker runtime routes.

Dynamic checks:

- Playwright representative flows;
- collect request origins;
- compare with allowlist;
- fail on unexpected origin.

Output:

- `artifacts/audit/network-origins.json`
- `artifacts/audit/network-audit.md`

### `npm run audit:licenses`

Checks:

- root GPL notice;
- RepQuest attribution;
- Workout.cool MIT notice if donor map has entries;
- Free Exercise DB notice/source pin;
- dependency licence summary;
- unknown/restricted licence;
- media source metadata.

Output:

- `artifacts/audit/license-report.json`
- `artifacts/audit/license-report.md`

### `npm run audit:assets`

Checks:

- broken paths;
- duplicate image hashes;
- missing dimensions;
- oversized assets;
- unsupported formats;
- missing source/licence metadata;
- missing alt text;
- service-worker cache eligibility;
- user-media path leakage.

### `npm run quality`

Runs the checkpoint-appropriate gate. Task 01 defines base composition. Later tasks add phase checks.

## 2. Finding schema

```json
{
  "id": "AUD-ARCH-001",
  "severity": "blocker|high|medium|low|info",
  "subsystem": "architecture",
  "title": "UI imports Dexie table directly",
  "evidence": ["src/...:42"],
  "requirementIds": ["WKT-001"],
  "checkpoint": "CP3",
  "recommendation": "Use WorkoutRepository",
  "fingerprint": "stable-hash"
}
```

Fingerprints keep known findings stable across reports.

## 3. Baseline and diff

CP0 creates the baseline audit. Every later report includes:

- new findings;
- resolved findings;
- worsened findings;
- accepted exceptions;
- bundle/asset/network/schema/version diff.

An exception requires:

- owner;
- rationale;
- expiry checkpoint/version;
- linked risk;
- no silent suppression.

## 4. Machine-readable checkpoint status

Generate:

```text
artifacts/audit/checkpoint-readiness.json
```

Fields:

- checkpoint;
- commit;
- passed;
- blockingFindings;
- requiredCommands;
- commandResults;
- requirementCoverage;
- reportPaths;
- generatedAt.

Codex may not claim checkpoint readiness if `passed` is false.

## 5. Determinism

Audit output order is stable. Timestamps and machine-specific paths are normalized where possible so diffs remain useful.
