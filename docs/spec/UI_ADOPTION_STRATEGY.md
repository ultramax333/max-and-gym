# Workout.cool UI adoption strategy

## Objective

Use Workout.cool to shorten design discovery without importing its server architecture or creating a mixed, fragile frontend stack.

## Donor audit

Task 00 must pin an immutable Workout.cool commit and inspect these categories:

- shared UI primitives;
- layout/navigation;
- exercise cards and details;
- search and filters;
- program list/detail/builder;
- workout-session presentation;
- statistics and charts;
- loading, empty, error, and responsive states.

The output is a donor matrix using `docs/templates/UI_DONOR_MATRIX_TEMPLATE.md`.

## Adoption classifications

Each donor pattern receives one classification:

### A — Inspire only

Use screenshots/behavior as reference and implement independently in Material UI.

Default classification.

### B — Reimplement algorithm

Reuse an interaction or pure algorithm concept, but write a new max&gym implementation.

Examples:

- filter grouping;
- card information hierarchy;
- set-row responsiveness;
- chart summary calculation.

### C — Adapt isolated client code

Allowed only when:

- file is purely client-side;
- no Next.js server APIs;
- no authentication;
- no Prisma/database coupling;
- no Tailwind/shadcn/Radix runtime dependency that would be imported solely for it;
- code reuse is materially simpler than reimplementation;
- tests can isolate it;
- MIT provenance is recorded.

### D — Reject

Mandatory for:

- server actions;
- Prisma/PostgreSQL;
- Better Auth;
- Stripe;
- advertising/premium;
- email;
- leaderboards/social;
- remote media without licence;
- duplicated component framework;
- SEO/marketing pages irrelevant to max&gym.

## Material UI translation rules

Translate donor patterns into max&gym tokens:

- Tailwind colours → Material UI theme tokens;
- Radix/shadcn dialog → Material UI Dialog/Drawer/BottomSheet pattern;
- donor typography → max&gym typography scale;
- donor spacing → 4-pixel max&gym grid;
- donor animation → reduced, purposeful max&gym motion;
- donor navigation → five-item max&gym information architecture;
- donor forms → max&gym validation and error copy.

Do not attempt pixel-perfect replication.

## Priority donor patterns

1. mobile navigation density;
2. exercise-card hierarchy;
3. full-screen mobile filtering;
4. program cards and day accordions;
5. builder reordering and grouping;
6. active-workout set presentation;
7. bottom-sheet actions;
8. progress chart composition;
9. empty/loading states.

## Non-priority donor areas

- landing/marketing pages;
- account screens;
- payment/subscription screens;
- social or leaderboards;
- multilingual administration;
- content-management back office;
- advertisement placements;
- public profile features.

## Provenance workflow

For every classification C item:

1. pin commit;
2. record original path;
3. record destination;
4. retain copyright/MIT notice;
5. remove framework/server coupling;
6. add focused tests;
7. record modifications;
8. add row to `THIRD_PARTY_CODE_MAP.md`;
9. include in pull-request evidence.

## Visual acceptance

A screen is accepted when:

- it follows max&gym design tokens;
- it works at 360 × 800 and 412 × 915;
- primary action is obvious;
- one-handed operation is practical;
- loading/error/empty states exist;
- keyboard and screen-reader behavior works;
- it does not look like a branded clone of Workout.cool;
- no second UI framework enters the production bundle.
