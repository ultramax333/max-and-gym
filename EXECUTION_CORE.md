# max&gym execution core

This is the compact, permanent contract Codex loads for every task.

## Product

- English, single-user workout Progressive Web App.
- Android Chrome primary.
- GitHub Pages.
- Local-only Dexie/IndexedDB data.
- No backend, account, sync, analytics, ads, payments, social, nutrition, or remote artificial intelligence.
- RepQuest is the technical foundation.
- Workout.cool is UI reference/selective isolated MIT donor only.
- Material UI is the sole production component system.

## User and training

- Advanced, full gym.
- Two or three sessions per week.
- Main sessions: 40 or 60 minutes.
- Core: 10 or 15 minutes.
- Goals: strength, hypertrophy, conditioning.
- Hard-exclude bunny jumps, burpees, plank-to-stand, rapid floor-to-standing, and equivalent high-impact transitions everywhere.
- Main lifts stable 4–6 weeks; accessories 2–4 weeks.
- Progression changes require confirmation.
- No medical claims.

## Reliability

- Active workout is persisted, not UI-only.
- Critical writes are transactional and idempotent with operation IDs.
- At most one active/paused workout.
- Timers use timestamps and recover on reopen.
- No forced service-worker reload during workout/critical write.
- No destructive database reset.
- Every migration has fixtures, tests, journal, postcheck, and recovery.
- No real user data in fixtures, logs, screenshots, or commits.

## Media and privacy

- Seed exercises use reviewed local two-position images.
- Custom exercise uses one local image in version 1.
- Progress photos are compressed local Blobs.
- User media is never service-worker cached or uploaded.
- Personal backup and diagnostic export are separate.
- Diagnostics exclude notes, photos, loads, repetitions, measurements, and personal names by default.

## Architecture

- Feature-first.
- Domain code does not import React, Material UI, Dexie, or browser UI APIs.
- UI does not access Dexie tables directly.
- Persistent access uses repositories/application services.
- Do not add global state or a second UI framework without an accepted Architecture Decision Record.
- Hash routing is the default for GitHub Pages.

## Process

For one task only:

1. Audit.
2. Plan.
3. Apply.
4. Verify.
5. Checkpoint report.
6. Pull request.
7. Stop.

Never merge or begin the next task automatically.

For incidents, Task 90 is read-only by default; `MODE=FIX` is required before product code changes.

## Definition of task completion

- listed requirement IDs implemented;
- phase tests pass;
- production build passes;
- project audit passes;
- no unexpected network origin;
- data/migration/cache impact documented;
- diagnostics cover critical failures;
- checkpoint report provides evidence;
- rollback or forward recovery documented.
