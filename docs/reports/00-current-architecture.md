# Task 00 — current RepQuest architecture

- Base commit: `bc488fa76c5f37247831a9a86b955d35d87ca61c`
- Verdict: usable migration foundation with high persistence/UI coupling

## Source layout

```text
src/
  components/     shared-looking MUI widgets with workout coupling
  context/        database, user, settings, timer, calendar, workout state
  db/             Dexie databases and JSON backup/import
  exerciseDb/     bundled Free Exercise DB JSON
  i18n/           Catalan, English, Spanish strings
  models/         mutable numeric-ID records
  pages/          route screens and editors
  utils/          calculations, identifiers, audio, formatting
```

The app is page-oriented rather than feature-first. There is no domain/application/repository boundary.

## Bootstrap and providers

`src/index.tsx` initializes i18next and renders `App`. `src/App.tsx` then composes:

```text
ErrorBoundary
  ThemeProvider
    DialogContextProvider
      SupabaseContextProvider
        DBContext (new DexieDB + MasterDB per render)
          HashRouter
            DBGuard
              TimerContextProvider
                UserContextProvider
                  SettingsContextProvider
                    CalendarProvider
                      WorkoutContextProvider
                        AppRoutes
```

Positive baseline elements are React strict mode, Material UI, a hash router, a root error boundary, Dexie, and local font packages. Risks include module-level service-worker registration, optional telemetry initialization, direct construction of database instances during render, and provider-wide mutable state.

## Route inventory

The hash router exposes onboarding, local/cloud login, workout list, tools/timer, history, statistics, body measures, settings/telemetry/backup/system, active workout and post-workout, workout/exercise editors, YouTube/picture viewers, release notes/licence, account, annual summary, and end-of-life screens.

Routes to remove or replace include cloud login, telemetry, remote YouTube, account switching, and end-of-life redirects. Routes to preserve temporarily include workout list/editor, active workout, history, metrics, backup, settings, and licence.

## State and data flow

- React contexts hold settings, current user, timer clock, and the complete active workout presentation state.
- The active workout is serialized as one `workoutContext` JSON value in `localStorage` at `src/context/workoutContext.tsx:536` and restored at line 137.
- Set data is written to Dexie, but session identity, current position, elapsed time, rest start, and post-workout state are not represented by a persistent workout-session entity.
- Many pages and contexts call `db.<table>` directly. UI, orchestration, and persistence are therefore coupled.
- Settings are split between `localStorage` and a separate `system` IndexedDB user table.

## Current workout behavior

The existing context can start a workout, traverse exercises and sets, save performed sets, handle simple supersets, calculate personal bests, start a rest timer, resume the serialized UI context, add/remove sets, substitute an exercise, and show a post-workout summary.

Critical gaps against max&gym:

- no persisted `WorkoutSession` aggregate;
- no operation identifiers or duplicate-write guard;
- set completion updates a set and clones a workout-exercise record, but does not atomically persist the full session position;
- `setIsFetching(false)` occurs inside a Dexie transaction before an explicit post-commit success boundary;
- rest uses a `restStarted` date plus in-memory duration, not a persisted `endsAt` timer entity;
- stopping a workout clears context state rather than committing a durable completed-session record;
- a one-hour autostop can discard the active presentation state;
- recovery validation and repair diagnostics do not exist.

## Preserve / wrap / refactor / replace / remove

| Area | Decision | Reason |
|---|---|---|
| React + TypeScript + Vite | Preserve | Matches target stack |
| Material UI and Emotion | Preserve | Sole target component system |
| Dexie/IndexedDB | Preserve | Correct local-first foundation |
| Hash routing | Preserve, then subpath-test | Correct for GitHub Pages |
| Local Roboto package | Preserve temporarily | No remote font dependency |
| One-repetition-max/body calculations | Wrap and test | Pure utilities are salvageable after formula review |
| Existing models | Wrap, then migrate | Required for legacy data compatibility |
| `db/backup.ts` | Replace behind a compatibility reader | Destructive restore and no validation/checksums |
| Database/context direct access | Refactor behind repositories | Violates target dependency direction |
| Workout context | Replace incrementally | UI-only session state is the largest reliability risk |
| Timer context | Replace incrementally | Interval clock is presentation-only and not persisted |
| Existing screens | Keep temporarily, then replace route by route | Avoid big-bang rewrite |
| Sentry, Alceris, Supabase | Remove in CP1 | Forbidden runtime/network scope |
| Cloud/account/telemetry/YouTube routes | Remove | Out of product scope |
| Light theme and extra languages | Remove/defer | V1 is English dark-only |

## Test and error inventory

- No automated test files.
- No lint script despite ESLint-related configuration remnants.
- One class error boundary logs to Sentry or `console.error`, but no stable error codes, redaction, route/workout boundaries, diagnostic store, or self-test exists.
- CI can silently accept a failed push build.

## Migration conclusion

RepQuest should remain the technical base, but not the target architecture. The safe route is a strangler migration: stabilize and remove external services, introduce repositories around the current schema, then replace the active-workout vertical slice while retaining read compatibility with existing numeric-ID records.
