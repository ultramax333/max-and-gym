# Workout.cool UI donor matrix

- Donor repository: `https://github.com/Snouzy/workout-cool`
- Immutable commit: `e3dcd23b4ebdfb6254010b9a7c350cfef9e236c8`
- Commit date: 2026-07-31 14:30:08 +0300
- Audit date: 2026-08-06
- Auditor: Codex, Task 00

Classification:

- A — inspire only;
- B — reimplement algorithm/interaction;
- C — adapt isolated client code;
- D — reject.

Workout.cool at the pinned revision is Next.js 16/React 19 and depends on Prisma/PostgreSQL, Better Auth, Stripe, Tailwind, Radix, DaisyUI, Zustand, React Query, Recharts, ads, premium, email, and server/API routes. It is not a compatible code foundation.

| ID | Donor area/path | User value | Coupling | Class | max&gym destination | MUI translation / decision |
|---|---|---|---|---|---|---|
| UI-DONOR-001 | `src/features/layout/BottomNavigation.tsx` | fixed mobile navigation and active indicator | Next routing, Tailwind, premium/leaderboard tabs, Lucide | A | `MobileBottomNavigation` | Rebuild with MUI BottomNavigation and exactly Home/Train/Programs/Progress/Library |
| UI-DONOR-002 | `src/features/layout/Header.tsx` | compact top bar density | auth, premium, ads, remote billing, Next Image | D | `TopBar` | Reject code and account/commercial content; use only generic top-bar concept |
| UI-DONOR-003 | `src/features/workout-builder/ui/exercise-card.tsx` | image/title/metadata/action hierarchy | Prisma enums, Next Image, Radix/shadcn, videos, remote state | B | `ExerciseCard` | Reimplement hierarchy in MUI with reviewed local paired images |
| UI-DONOR-004 | `exercise-list-item.tsx` and `exercise-pick-modal.tsx` | compact selection and mobile picker | Tailwind UI, server-backed exercise actions | B | `ExercisePicker`, `ExerciseFilterSheet` | Rebuild as local IndexedDB query and full-screen MUI mobile sheet |
| UI-DONOR-005 | workout-builder muscle/equipment selection | progressive filtering concepts | server actions, Prisma attributes, custom SVGs | B | generator/filter steps | Reimplement normalized local filter grouping; do not copy anatomy assets without media review |
| UI-DONOR-006 | `workout-session-set.tsx` | stacked mobile set card and explicit completed/edit state | donor UI primitives and donor set schema | B | `SetCard`, `SetTable` | Reimplement with max&gym typed inputs, 48px targets, pending/failed state, idempotent command |
| UI-DONOR-007 | `workout-session-list.tsx` | current-exercise emphasis and timeline/progress | ads, confetti, remote videos, Zustand/service hooks | A/B | active-workout screen | Reuse only information hierarchy; no code or gamification |
| UI-DONOR-008 | `workout-session-header.tsx` | exercise progress and compact metrics | donor store, local preference, Tailwind | A | `WorkoutProgressHeader` | Rebuild with elapsed time, progress, pause, finish; exclude volume if it crowds phone UI |
| UI-DONOR-009 | `workout-session-timer.tsx` | floating timer/action cluster | decrement-style component and non-persisted state | A | `RestTimerBar`, `RestTimerSheet` | Visual inspiration only; target uses persisted timestamps |
| UI-DONOR-010 | `src/shared/lib/workout-session/workout-session.local.ts` | local fallback idea | localStorage cap of 10, server sync states, no transactions | D | repositories | Reject; use Dexie repositories and durable session aggregate |
| UI-DONOR-011 | `src/features/programs/ui/program-card.tsx` | card metadata hierarchy | server translation, Prisma, premium, Next Image | A | `ProgramCard` | Rebuild with MUI and local Program data |
| UI-DONOR-012 | `program-detail-page.tsx` | tabs, weeks, session overview, progress | server actions, auth, premium/ads, URL state | A/B | Program detail | Reimplement day accordions and duration/weekly balance locally |
| UI-DONOR-013 | admin `program-builder.tsx` and modal set | grouping/editing workflow reference | admin role, Prisma, server actions, donor dialogs | D | Program builder | Reject code; design a local accessible MUI builder with move buttons |
| UI-DONOR-014 | statistics exercise browser and tab composition | selector plus loading/error chart cards | React Query/API routes, premium gate | A/B | Progress | Reimplement local query flow and state composition |
| UI-DONOR-015 | `WeightProgressionChart.tsx`, `VolumeChart.tsx`, `OneRepMaxChart.tsx` | chart framing and empty overlay | Recharts, random skeleton data, donor theme | A | `ChartCard` | Keep MUI X Charts if retained; add deterministic empty state and text summary |
| UI-DONOR-016 | `src/components/ui/*` | broad primitive library | Radix, Tailwind, DaisyUI, shadcn conventions | D | shared MUI primitives | Do not import a second component system |
| UI-DONOR-017 | loading/empty/error patterns across programs/statistics | explicit data states | mixed donor primitives and remote queries | B | shared state components | Reimplement copy and actions with max&gym diagnostics |

## Mandatory rejections confirmed

- Server actions and Next.js API routes: rejected.
- Prisma/PostgreSQL: rejected.
- Better Auth and account flows: rejected.
- Stripe, RevenueCat, premium, and billing: rejected.
- Advertisements, sponsors, analytics, and consent stack: rejected.
- Email: rejected.
- Leaderboard/social/profile systems: rejected.
- Tailwind, shadcn, Radix, DaisyUI, Zustand, and donor UI primitives: rejected as production dependencies.
- Workout.cool videos, thumbnails, mascot, logo, emoji assets, and other unverified media: rejected.

## Direct code reuse

No classification C candidate is approved at CP0. `THIRD_PARTY_CODE_MAP.md` therefore remains empty. Reimplementation in Material UI is cheaper and safer than extracting donor code from its framework, commercial, and server coupling.
