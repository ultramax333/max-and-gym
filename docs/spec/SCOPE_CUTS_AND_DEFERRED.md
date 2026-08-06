# Scope cuts and deferred features

These cuts are deliberate optimizations, not missing requirements.

## Removed from version 1

### Light theme

Reason: doubles visual-state validation with no core training value.

### Exercise video library

Reason: media licensing, storage, offline caching, bundle, and performance risk. Two-position local images plus concise instructions are sufficient for version 1.

### Multiple custom exercise images/video

Reason: expands media schema and backup complexity. One image is sufficient initially.

### Cloud synchronization and account

Reason: conflicts with local-only/GitHub Pages architecture and introduces authentication, backend, privacy, and maintenance.

### Nutrition

Reason: unrelated product domain and large data/content burden.

### Social/leaderboard/public sharing

Reason: personal application and privacy-first objective.

### Remote artificial intelligence

Reason: runtime cost/network/privacy/non-determinism. Generator is deterministic and explainable.

### Wearables and Health Connect

Reason: platform/API integration outside core workout reliability.

### Automatic background alarm guarantee

Reason: a normal browser PWA cannot reliably guarantee execution after Android suspends or kills the process. Accurate recovery on reopen is required instead.

### Daily readiness score system

Reason: additional subjective data and programming complexity. Version 1 uses actual training performance, explicit discomfort, and user decisions.

### Multiple split families

Reason: Full Body A/B and A/B/C best support flexible two-/three-day schedules. Upper/Lower or other splits may be added after version 1.

## Deferred after version 1

- light theme;
- encrypted backup;
- optional manually connected cloud backup;
- additional languages;
- custom exercise video;
- extra split templates;
- wearable/Health Connect;
- richer exercise animation;
- local advanced readiness model;
- optional custom domain.

## Rule

A deferred feature requires:

- explicit product decision;
- Architecture Decision Record;
- impact on data/export/cache;
- new tests;
- checkpoint/release plan.

Codex must not implement a deferred item opportunistically.
