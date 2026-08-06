# max&gym — Codex implementation package, version 2

Prepared: 2026-08-05

## Product in one sentence

**max&gym** is a private, local-first, installable workout web application for Android that combines advanced workout logging, deterministic strength/hypertrophy programming, low-impact conditioning, 10/15-minute core sessions, 40/60-minute gym sessions, body measurements, progress photos, reliable backup, and built-in diagnostics.

## Final strategy

### Technical foundation

Use **RepQuest** as the only technical foundation:

- React;
- TypeScript;
- Vite;
- Material UI;
- Dexie and IndexedDB;
- Progressive Web App foundations;
- static deployment to GitHub Pages.

RepQuest is not treated as an untouchable architecture. Audit it, preserve sound local workout and persistence logic, migrate weak parts deliberately, and replace its visual identity.

### User-interface donor

Use **Workout.cool** only as:

- a design and interaction reference;
- a source of isolated MIT-licensed client-side components or utilities when reuse is clearly cheaper than reimplementation;
- a source of layout patterns for exercises, programs, sessions, statistics, filters, drawers, and responsive navigation.

Do **not** import or reproduce its server architecture. Do not bring Next.js server actions, Prisma, PostgreSQL, Better Auth, Stripe, advertising, email, leaderboard, premium, or social systems into max&gym.

### UI stack decision

The production application uses **Material UI only** for the component system. Do not mix Material UI with Tailwind, shadcn/ui, Radix UI, DaisyUI, or another design system merely to copy Workout.cool. Reimplement donor patterns with max&gym tokens and Material UI primitives. A directly adapted donor component is allowed only when isolated, useful, licensed, documented in `THIRD_PARTY_CODE_MAP.md`, and free of server/framework coupling.

## Fixed product decisions

- App language: English.
- Primary device: Android phone with Chrome.
- Hosting: GitHub Pages.
- Data: local-only in IndexedDB; no account or cloud sync.
- User: advanced trainee with full commercial-gym access.
- Goals: strength, hypertrophy, and general conditioning.
- Frequency: two or three gym sessions per week.
- Main sessions: 40 or 60 minutes.
- Core sessions: 10 or 15 minutes.
- Known constraint: exclude bunny jumps, burpees, plank-to-stand, rapid floor-to-standing, and comparable high-impact transitions.
- Warm-up: short, dynamic, exercise-specific, with an optional low-back-comfort sequence.
- Tracking: workouts, body weight, measurements, and progress photos.
- Visual direction: dark, restrained, modern, premium, touch-first.
- Brand: `max&gym`.
- Tagline: `Train with intent.`

## Scope optimizations made in this package

To reduce risk and reach a reliable product sooner:

- version 1 is dark-theme only;
- seeded exercise demonstrations use two-position images rather than video;
- custom exercises support one local image in version 1;
- the first usable milestone is a complete workout vertical slice before the generator, charts, or photos;
- service-worker updates use a prompt and are deferred during an active workout;
- Android timer alerts are best-effort when the process is suspended or killed, but timer recovery on reopen is mandatory;
- only reviewed exercises may be selected automatically;
- every progression proposal requires confirmation;
- backup data and diagnostic data are exported separately;
- diagnostics are designed before feature growth.

## Mandatory development protocol

Every Codex task follows:

> **AUDIT → PLAN → APPLY → VERIFY → CHECKPOINT**

Codex must complete one task at a time, open one reviewable pull request, produce evidence, and stop. It must not automatically merge or begin the next task.

## Where to start

1. Fork `marcsances/repquest` into a repository named `max-and-gym`.
2. Add every file from this package at the repository root, preserving directories.
3. Open the fork in Codex.
4. Paste the exact contents of `START_CODEX_TASK.txt`.
5. Codex uses `EXECUTION_CORE.md` plus `TASK_CONTEXT_MAP.md` so later tasks do not reload the entire reference set.
6. Do not ask Codex to build the whole app in one pass.
7. Review the checkpoint report after every task before continuing.

## Document precedence

When documents conflict, apply this order:

1. `PROJECT_CONTRACT.json`
2. `docs/spec/DECISIONS.md`
3. `docs/spec/SAFETY_AND_PRIVACY.md`
4. `docs/spec/PRODUCT_SPEC.md`
5. `docs/spec/ACCEPTANCE_TESTS.md`
6. `docs/spec/ARCHITECTURE.md`
7. `docs/spec/CHECKPOINTS.md`
8. Remaining documents

## First usable milestone

Checkpoint 3 is the first internal gym-ready milestone. It must support:

- install and launch on Android;
- start or resume a workout;
- log sets without duplicate saves;
- run and recover rest timers;
- persist an active session through reload or closure;
- finish a session;
- inspect an accurate summary;
- work offline after initial installation.

The project must not move to exercise import, program generation, photos, or charts until that vertical slice is dependable.

## On-demand error audit

When a defect appears during construction or after release, use `RUN_PROJECT_AUDIT.txt`. It invokes Task 90, preserves evidence, compares the current state with the last accepted checkpoint, isolates the first failing subsystem, and creates a root-cause report before any correction is attempted.

The default mode is diagnostic only. A fix requires an explicit `MODE=FIX`, a reproducible failure or supported root cause, and a regression test.
