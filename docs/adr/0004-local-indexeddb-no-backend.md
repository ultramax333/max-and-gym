# ADR 0004 — Local IndexedDB and no backend

- Status: Accepted
- Date: 2026-08-05

## Decision

All personal data is stored locally with Dexie/IndexedDB. GitHub Pages serves static assets. No account, server, remote database, or synchronization is included in version 1.

## Consequence

Privacy and zero hosting cost improve. Cross-device transfer requires manual export/import, and browser storage resilience must be handled explicitly.
