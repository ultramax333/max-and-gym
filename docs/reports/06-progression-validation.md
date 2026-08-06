# Task 06 — Progression validation

## Result

Finishing a program workout creates pending proposals; it never silently edits the active prescription. The proposal repository applies changes only through explicit transactional actions.

## Rule coverage

| Requirement | Evidence |
|---|---|
| GEN-013 | Double progression proposes an increase only after all required sets reach the upper rep bound at the prescribed effort; otherwise it holds. |
| GEN-014 | Fixed-increment and top-set/back-off rules return explicit proposed load/set changes. |
| GEN-015 | Conditioning progression proposes a bounded time increase. |
| GEN-016 | Regression and repeated underperformance produce a pending deload-review proposal. Manual rules remain on hold. |
| GEN-017 | `ProgressionProposalRepository` implements accept, edit-and-accept, reject and postpone. Accept/edit update the prescription and proposal in one Dexie transaction; reject/postpone never touch it. |
| AT-G12 | An exercise-linked discomfort flag converts an otherwise valid increase to a hold proposal. |

## Persistence flow

1. A program exercise ID is copied into the immutable workout snapshot.
2. Workout completion calculates one idempotent proposal per session exercise.
3. The proposal is stored as `pending` in schema 7.
4. The Progress screen exposes Accept, Edit + accept, Postpone and Reject.
5. Only confirmed Accept or Edit + accept can update `exercisePrescription`.

## Automated evidence

- `src/generator/progression.test.ts`: success, hold, regression/deload, discomfort, fixed increment, top/back-off, conditioning and manual hold;
- `src/progression/ProgressionProposalRepository.test.ts`: accepted/edited transactions and unchanged prescriptions for rejected/postponed proposals;
- `src/programs/ProgramRepository.test.ts`: workout finish creates a pending proposal while leaving the program prescription untouched.

No background timer, implicit clock or automatic acceptance path exists.
