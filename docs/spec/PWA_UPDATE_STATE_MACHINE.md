# Progressive Web App update state machine

## States

```text
CURRENT
  └─ new worker installed → UPDATE_WAITING

UPDATE_WAITING
  ├─ no active critical state + user accepts → APPLYING
  ├─ active workout/critical operation → DEFERRED
  └─ user postpones → DEFERRED

DEFERRED
  ├─ workout ends and user accepts → APPLYING
  ├─ safe pause and explicit confirmation → APPLYING
  └─ continue current build → DEFERRED

APPLYING
  ├─ worker activates + controlled reload → CURRENT
  └─ failure → UPDATE_ERROR
```

## Rules

- Never call skip-waiting/reload automatically during an active workout.
- Never update during a database migration, import commit, backup finalization, or photo write.
- Persist that an update is waiting only as non-critical UI state; rediscover from service-worker state on boot.
- Show current and waiting build identity where available.
- Applying update reloads only after current writes complete.
- Cache cleanup does not clear IndexedDB.
- A failed update exposes Diagnostics and current build remains usable when possible.
