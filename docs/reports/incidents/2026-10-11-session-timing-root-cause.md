# Session set adjustment and personal duration estimates

Date: 2026-10-11. Base: aa3ad04 (v1.12.0). Mode: FIX, requested by the owner.

## Evidence and cause

The active-workout page exposes Add one set only. The repository implements only
a +1 current / -1 future trade. No inverse command exists. The repetitions
stepper already allows subtraction down to zero; removing a working set is the
missing plan operation.

Quick-session duration assumes 10 + 3 seconds per repetition (30–85 seconds per
set), static setup and transitions. Historical completion timestamps and actual
elapsed session durations are unused. The session target remains fixed even when
the estimated plan changes. Replacing an exercise also leaves preview duration
stale. These facts explain optimistic estimates and missing recalculation.

## Plan

Add a safe inverse working-set trade, preserve performed work and the chosen time
target, and show updated remaining/projected duration. Learn per-exercise pace
from consecutive completed working sets in local completed sessions, separately
by training goal, excluding pauses, invalid samples, supersets and outliers.
Use samples only after sufficient evidence and expose the estimate clearly.
Keep configured recovery fixed and adjust generated volume to the time budget.

Optional active-elapsed completion snapshots require no index/store migration.
Backups keep these fields. Existing unpaused history can supply timing samples;
historical paused sessions without elapsed snapshots are excluded.

## Verification and safety

Synthetic repository tests cover subtraction, replay, rollback, position repair,
completed-work protection and timing across pauses. Domain tests cover learning,
minimum evidence, recovery subtraction and duration bounds; generator tests cover
personal pace and unchanged rest. Mobile browser validation covers the controls.
No real workout data is read, logged or exported. Schema 8/export 2/cache 9 remain
unchanged. A source rollback understands records with optional timing fields.

Physical-device reproduction is unavailable; diagnosis is based on the shipped
v1.12.0 code and synthetic fixtures. Verification results follow in the checkpoint.
