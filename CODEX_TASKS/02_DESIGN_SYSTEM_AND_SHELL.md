# Task 02 — max&gym design system and application shell

## Prerequisite

CP1 accepted.

## Objective

Create the polished max&gym shell and reusable Material UI system without destabilizing persistence or workout logic.


## Owned requirement IDs

`UI-010`, `UI-011`, `UI-012`, `UI-013`, `UI-014`, `UI-015`, `UI-016`, `UI-017`, `UI-018`, `UI-019`, `UI-020`.

## Donor procedure

Use the CP0 Workout.cool donor matrix. For each adopted pattern:

- A/B: implement independently using max&gym Material UI;
- C: verify isolation, add tests, record in `THIRD_PARTY_CODE_MAP.md`;
- D: do not use.

No Tailwind, shadcn/ui, Radix UI, DaisyUI, Next.js, or donor server dependency may enter production.

## Scope

- implement theme/tokens from `docs/spec/DESIGN_SYSTEM.md`;
- dark theme only;
- local/system font stack;
- responsive AppShell;
- five-item mobile bottom navigation;
- desktop navigation rail/sidebar;
- route shells: Home, Train, Programs, Progress, Library, Settings;
- onboarding shell;
- Diagnostics integrated into Settings;
- foundational components from `docs/spec/COMPONENT_CATALOG.md`;
- loading, empty, error, offline, update, storage states;
- safe-area handling;
- mobile numeric inputs;
- reduced motion;
- semantic headings/focus;
- accessible reordering primitives for later use;
- visual regression baseline.

Legacy functional screens may temporarily render inside the new shell if needed, but there must be one clear owner per route.

## Non-goals

- no active-workout behavior rewrite;
- no new schema;
- no exercise import;
- no generator;
- no charts/photos.

## Required tests

- target mobile/desktop layouts;
- navigation and route state;
- focus and keyboard;
- touch target checks where automatable;
- reduced motion;
- error/offline states;
- no second UI framework/dependency;
- no network-origin regression;
- donor provenance test if C reuse exists.

## Manual evidence

Screenshots at:

- 360 × 800;
- 412 × 915;
- desktop.

Include:

- Home shell;
- navigation;
- empty state;
- error state;
- Diagnostics;
- onboarding.

## Deliverables

- `docs/reports/02-ui-donor-application.md`;
- `docs/reports/02-visual-accessibility-audit.md`;
- `docs/reports/02-cp2-checkpoint.md`;
- updated component catalogue/provenance/traceability.

## CP2 exit gate

- max&gym visual identity is coherent;
- Material UI is the only production system;
- target viewports work;
- accessibility baseline passes;
- no data/persistence regression;
- CP2 report accepted.

Open one pull request and stop.
