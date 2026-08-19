# Codex master prompt — max&gym

You are implementing **max&gym**, an English, local-first, installable workout web application for one advanced user.

The entire product, architecture, sequence, safety rules, test strategy, and checkpoints are already designed in this repository. Your role is to implement them faithfully, not redesign the product or expand its scope.

## First action

Before changing code:

1. read `EXECUTION_CORE.md`;
2. read `PROJECT_CONTRACT.json`;
3. read `AGENTS.md`;
4. read the current task under `CODEX_TASKS/`;
5. read the task-specific documents in `TASK_CONTEXT_MAP.md`;
6. for Task 00 only, read and audit every file under `docs/spec/`;
7. inspect the repository and compare reality with the specification;
8. report any blocking contradiction before implementation.

## Foundation and donor

- RepQuest is the technical foundation.
- Workout.cool is a UI donor/reference only.
- Keep Material UI as the only production UI system.
- Do not introduce Workout.cool’s Next.js, Prisma, PostgreSQL, authentication, payments, ads, premium, email, social, or leaderboard systems.
- Reimplement donor patterns with max&gym Material UI components unless direct isolated reuse is demonstrably simpler.
- Record all direct donor reuse in `THIRD_PARTY_CODE_MAP.md`.

## Mandatory phase discipline

Use exactly one task file at a time. For each task:

1. create or update an audit report;
2. state the implementation plan;
3. implement only the task scope;
4. add or update tests;
5. run verification commands;
6. run the phase audit;
7. write `docs/reports/<task-id>-checkpoint.md`;
8. open a pull request using the template;
9. stop.

Do not begin the next task or hide failed checks. After stopping at the pull request and after all required checks pass, Codex may ask the project owner whether to merge that specific pull request and commit. Merge only after a fresh explicit approval replying to that request; standing permission or an earlier generic `Go` is not sufficient.

## Non-negotiable product constraints

- English UI.
- Android Chrome primary.
- GitHub Pages static deployment.
- Local-only IndexedDB data.
- No account, backend, cloud sync, analytics, telemetry, Sentry, ads, payment, or remote artificial intelligence.
- Full core experience offline after initial load.
- Active workout survives reload and closure.
- No destructive database migration.
- Prompted application updates, deferred during active workouts.
- Hard movement exclusions apply everywhere.
- Progression changes require explicit user confirmation.
- Photos remain local and are excluded from diagnostic exports.
- No user-sensitive values in production logs.

## Completion standard

A task is complete only when:

- its checkpoint acceptance criteria pass;
- all required commands pass;
- tests prove critical behavior;
- a report provides evidence;
- no unexplained network call or schema mutation remains;
- the default branch would remain deployable after merge.

When unsure, choose the smallest implementation that satisfies the written contract and record the assumption in an Architecture Decision Record or checkpoint report.
