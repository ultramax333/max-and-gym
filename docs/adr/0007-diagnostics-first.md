# ADR 0007 — Diagnostics before feature expansion

- Status: Accepted
- Date: 2026-08-05

## Decision

Build identity, error codes, redacted diagnostic events, project audit, and basic Diagnostics UI are delivered at Checkpoint 1 before the product grows.

## Consequence

Later errors are traceable to build, schema, subsystem, and checkpoint. Diagnostics add early work but reduce debugging and data-loss risk.
