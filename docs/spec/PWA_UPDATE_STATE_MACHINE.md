# Progressive Web App update state machine

## States

```text
CURRENT
  └─ new worker installed → UPDATE_WAITING

UPDATE_WAITING
  ├─ no active critical state + user requests instructions → READY_TO_CLOSE
  ├─ active workout/critical operation → DEFERRED
  └─ user postpones → DEFERRED

DEFERRED
  ├─ workout ends and user requests instructions → READY_TO_CLOSE
  ├─ paused workout → DEFERRED
  └─ continue current build → DEFERRED

READY_TO_CLOSE
  ├─ user saves drafts and closes every app tab → APPLYING
  └─ another tab remains open → UPDATE_WAITING

APPLYING
  ├─ worker naturally activates; next app launch → CURRENT
  └─ failure → UPDATE_ERROR
```

## Rules

- Never call skip-waiting/reload automatically during an active workout.
- Never update during a database migration, import commit, backup finalization, or photo write.
- Persist that an update is waiting only as non-critical UI state; rediscover from service-worker state on boot.
- Show current and waiting build identity where available.
- No forced activation or page reload, including when a different tab observes an update. Natural service-worker activation after every controlled tab closes is the cross-tab boundary. The user saves drafts before closing; persisted workouts recover on the next launch.
- Cache cleanup does not clear IndexedDB.
- A failed update exposes Diagnostics and current build remains usable when possible.
