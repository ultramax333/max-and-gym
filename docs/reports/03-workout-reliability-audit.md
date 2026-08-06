# CP3 workout reliability audit

Date: 2026-08-06

## Implemented guarantees

- Start, complete-set, undo and finish commands use durable operation identifiers.
- Session, position, performed set and rest timer changes share Dexie transactions.
- Replaying the same operation returns the committed result.
- A second active/paused session is rejected.
- Failed ownership validation rolls back without a partial performed set.
- Rest truth uses persisted startedAt and endsAt timestamps; pause stores remaining
  seconds and resume derives a new end timestamp.
- Focus, visibility and boot call recovery; elapsed and invalid-owner timers are
  safely reconciled with diagnostic events.
- Active workout state defers a waiting PWA update.
- Timer feedback uses best-effort audio, vibration and wake lock; absence is
  non-blocking and diagnostic.

## Automated evidence

- Repository: start replay, one-active invariant, double-complete replay, rollback,
  undo, fake-clock timer and finish retry.
- Application service: unique operation IDs, active update marker, invalid timer
  repair and full offline start-to-finish journey.
- Database migration: a version 3 fixture opens additively as version 4.
- Full suite: 24 tests pass in the final quality replay.

## Browser evidence

At 412 x 915 against the production build:

1. started the six-set sample session;
2. recorded a set;
3. refreshed the route;
4. recovered 1/6 progress and the persisted rest timer;
5. completed 6/6;
6. finished and opened the persisted summary.

Screenshots:

- screenshots/03-active-workout-412x915.jpg
- screenshots/03-summary-412x915.jpg

The offline end-to-end path is automated against IndexedDB with no network
dependency. A physical Android Chrome install/background-kill run remains deferred
because the user does not currently have the phone available.

## Platform truth

A normal Android PWA cannot guarantee an alarm after the operating system kills the
process. The persisted timestamp remains authoritative and is reconciled on reopen.
