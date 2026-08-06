# ADR 0001 — RepQuest is the technical foundation

- Status: Accepted
- Date: 2026-08-05

## Context

max&gym must run as a local-first static Progressive Web App on GitHub Pages. RepQuest already uses React, TypeScript, Vite, Material UI, Dexie/IndexedDB, and workout logging.

Workout.cool is more feature-rich visually but relies on a server, PostgreSQL, Prisma, and authentication.

## Decision

Fork RepQuest and migrate it incrementally. Preserve sound local persistence/workout logic after audit. Do not convert Workout.cool into a local application.

## Consequences

Positive:

- architecture matches local-only/GitHub Pages;
- less persistence rewrite;
- lower hosting/maintenance burden.

Negative:

- more UI and product functionality must be built;
- RepQuest quality/coupling must be audited;
- migration discipline is essential.
