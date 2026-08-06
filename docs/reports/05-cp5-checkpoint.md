# CP5 checkpoint — Manual program builder

## Scope

- manual creation for two or three days and 40/60-minute targets;
- draft, active and archived views;
- add, remove, reorder, group and ungroup local library exercises;
- editable role, prescription, day metadata, lock, stability date and alternatives;
- duration breakdown, weekly balance and activation warnings;
- duplicate, activate and archive operations;
- active-program cards on Home and Train;
- immutable program-day workout snapshots;
- additive schema 6 and non-destructive legacy-plan import.

## Verification gates

- TypeScript strict typecheck;
- ESLint with program domain and screens included;
- unit and component suite, including migration and create-to-builder navigation regression;
- production PWA build and route smoke checks;
- interactive browser pass through create → add exercises → activate → start workout;
- visual desktop inspection of builder and active workout.

`PROJECT_STATUS.md` remains unchanged until this checkpoint is accepted and merged, per project policy.
