# Task 05 — Duration estimator

The estimator is deterministic and reports seconds for every component:

`warm-up + primary ramp sets + execution + prescribed rest + setup + transitions + conditioning`

Defaults used by the manual builder:

- 5 minutes of warm-up for a 40-minute day, 7 minutes for a 60-minute day;
- 3 minutes of ramping per primary exercise;
- 40 seconds of execution per working set;
- the complete prescribed rest between working sets;
- 75 seconds of setup per exercise;
- 45 seconds between exercises, with a 25-second reduction inside a declared group;
- explicit conditioning time entered per day.

The builder shows the total and each component. If the estimate exceeds the target by more than five minutes it displays a warning. It never shortens primary rest silently.

Weekly balance totals working sets by movement pattern and primary muscle. The first warning rules cover missing knee-dominant work and a large push/pull imbalance; Task 06 can extend this same pure calculation for generator scoring.
