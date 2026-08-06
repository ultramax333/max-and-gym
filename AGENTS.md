# AGENTS.md — permanent rules for Codex

For every task, read `EXECUTION_CORE.md`, this file, `PROJECT_CONTRACT.json`, the current task, and the documents listed for that task in `TASK_CONTEXT_MAP.md`. Task 00 performs the one complete read/audit of all specifications.

## Operating protocol

Every task uses this sequence:

1. **AUDIT** — inspect current code, dependencies, schema, tests, and affected risks.
2. **PLAN** — list requirements, files, migrations, tests, rollback, and exclusions.
3. **APPLY** — implement the smallest coherent change.
4. **VERIFY** — run all required checks and collect evidence.
5. **CHECKPOINT** — write a report under `docs/reports/`, open a pull request, and stop.

Never skip the audit because a change appears small. Never start the next task automatically. Never merge your own pull request.

When a defect appears, use `CODEX_TASKS/90_DIAGNOSTIC_AUDIT.md`. It is read-only by default; product code may change only under explicit `MODE=FIX` after root-cause evidence exists.

## Scope boundaries

- Single-user personal application.
- English interface.
- Android Chrome is the primary target.
- GitHub Pages is the hosting target.
- No backend, authentication, cloud sync, remote database, social feature, nutrition tracker, payment, advertisement, leaderboard, email system, or remote artificial-intelligence service.
- Do not retain a feature merely because it exists in RepQuest.
- Do not import Workout.cool server architecture.
- Do not copy proprietary Train Sweat Eat assets or wording.

## Source strategy

- RepQuest is the technical base.
- Workout.cool is a UI donor/reference only.
- Material UI is the sole production component system.
- Reimplement donor patterns in Material UI by default.
- Record any directly adapted MIT code in `THIRD_PARTY_CODE_MAP.md`, including repository, immutable commit, original path, destination path, modifications, and notice.
- Do not reuse videos or images without independent license verification.

## Architecture rules

- Keep domain logic independent from React and IndexedDB where practical.
- UI components must not call Dexie tables directly.
- Access persistent data through repositories/application services.
- Keep a feature-first module structure.
- Do not add Redux, Zustand, or another global state library unless an Architecture Decision Record proves the need.
- Use stable identifiers and idempotent operations for critical writes.
- Use database transactions for multi-record changes.
- Use explicit schema, seed, export, and cache versions.

## Data rules

- User data stays local.
- No destructive schema reset or `db.delete()` migration.
- Every schema change has fixtures and migration tests.
- Store weights in kilograms and lengths in centimetres.
- Store timestamps consistently and document the convention.
- Store images as Blob objects, not Base64 strings.
- Compress and re-encode progress photos before storage.
- Imports are validated and staged before replacing current data.
- A failed import or migration must leave existing data recoverable.
- Never place real user data in fixtures, screenshots, logs, or commits.

## Workout reliability rules

- Auto-save every meaningful action.
- A set completion has a unique operation identifier and is idempotent.
- Protect against double taps, retries, stale UI, and optimistic-write failure.
- Represent timers with persisted timestamps rather than decrement-only counters.
- Recover the active session after refresh, browser closure, or app update.
- Never force a service-worker reload during an active workout.
- Wake lock, vibration, audio, notification, and persistent storage are progressive enhancements.
- Do not claim background timer guarantees that Android browsers cannot provide after process termination.

## Safety rules

- Hard-filter bunny jumps, burpees, plank-to-stand, rapid floor-to-standing, and comparable high-impact transition tags.
- A user-blocked exercise or tag can never appear in generation, substitution, warm-up, or conditioning.
- Floor work is allowed when controlled and grouped to avoid repeated transitions.
- Do not make medical claims or diagnose pain.
- A discomfort report holds automatic progression and offers neutral options.

## UI and accessibility rules

- Dark theme only in version 1.
- Mobile-first and one-handed.
- Primary touch targets are at least 48 × 48 CSS pixels where practical.
- Critical workout data is never hover-only.
- Use bottom sheets or full-screen panels instead of small modals during workouts.
- Use tabular numerals for timers, loads, repetitions, and metrics.
- Design loading, empty, error, offline, storage, and permission-denied states.
- Meet Web Content Accessibility Guidelines 2.2 level AA.
- Respect reduced motion and provide non-drag alternatives for reordering.

## Diagnostics rules

- Every caught failure receives a stable error code and diagnostic event.
- Production diagnostic events are redacted and bounded.
- Do not log workout notes, photos, loads, repetitions, measurements, or personal text.
- Every checkpoint runs the project audit and self-test appropriate to its phase.
- A bug fix begins with a reproducible failing test whenever practical.
- Preserve build identity: app version, Git commit, build time, database version, export version, seed version, and cache version.

## Testing rules

- Unit-test domain calculations and constraints.
- Component-test critical forms and set logging.
- End-to-end-test all priority-zero journeys.
- Use fake clocks for timer tests.
- Test migrations with realistic anonymous fixtures.
- Test backup/restore with Blob media.
- Test offline and service-worker update flows.
- Test at 360 × 800, 412 × 915, and desktop viewports.
- A task is not complete because code compiles; its checkpoint criteria must pass.

## Reporting rules

Every pull request must include:

- task and requirement identifiers;
- current and target behavior;
- changed files;
- schema/export/cache changes;
- tests and exact commands;
- screenshots where relevant;
- accessibility evidence;
- performance/network evidence where relevant;
- known limitations;
- rollback instructions;
- donor-code provenance if applicable;
- checkpoint report path.
