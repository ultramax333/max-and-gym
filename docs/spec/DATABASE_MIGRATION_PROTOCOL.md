# Database migration protocol

## 1. Before coding

For every schema change, create:

- migration identifier;
- from/to versions;
- field/entity mapping;
- prior-version fixtures;
- expected counts/invariants;
- rollback/forward-recovery note;
- backup recommendation;
- migration evidence document.

## 2. Implementation

- Dexie version increments once.
- Migration is pure/local and does not fetch remote data.
- Large migrations use bounded batches when needed.
- Operation/migration journal records start.
- Transform preserves stable IDs where possible.
- Historical snapshots are created before removing mutable references.
- Seed update is not mixed with user schema migration unless unavoidable and documented.

## 3. Verification inside upgrade

After transform:

- required singleton/meta exists;
- record counts within expected constraints;
- relationships resolve;
- at most one active workout;
- timers valid;
- media references valid;
- required versions stored.

If postcheck fails, throw/abort when transaction semantics allow and expose recovery.

## 4. Test matrix

- empty database;
- every supported prior version;
- real-shaped anonymous history;
- active workout;
- media records;
- restart after success;
- induced failure at each stage;
- future version;
- low storage where practical;
- old build compatibility note.

## 5. User experience

During a non-trivial migration:

- show “Updating local data” with version;
- prevent concurrent writes;
- never invite closing/clearing data;
- on success continue;
- on failure show error ID, Diagnostics, and recovery/export options.

## 6. Rollback reality

A source-code rollback may not understand a newer schema. The pull request must state:

- backward compatible;
- forward-only;
- dual-read period;
- emergency forward-fix plan.

## 7. Prohibited behavior

- `db.delete()` as migration;
- silent new database name;
- swallowing migration exception and opening empty;
- dropping historical foreign references without snapshot;
- using actual user data in migration tests;
- shipping untested migration.
