# ADR 0002 — Workout.cool is a UI donor, not an architecture donor

- Status: Accepted
- Date: 2026-08-05

## Decision

Use Workout.cool for interface research and optional isolated MIT client-code adaptation. Reject its server, data, authentication, commercial, and social systems.

## Rules

- pin immutable commit;
- classify candidate pattern;
- reimplement in Material UI by default;
- record direct reuse;
- do not reuse unverified media.

## Consequence

max&gym benefits from mature interaction patterns without importing incompatible infrastructure.
