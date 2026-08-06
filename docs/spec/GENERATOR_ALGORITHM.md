# Deterministic generator algorithm

## 1. Inputs

Normalize:

- frequency;
- duration;
- goal weights;
- equipment;
- priorities;
- variation;
- hard constraints;
- exercise preferences;
- current block/stable exercises;
- recent comparable history;
- core/warm-up settings;
- generator version;
- seed.

Sort all unordered inputs before hashing/selection.

## 2. Weekly role template

### Two days

- Day A: knee dominant, horizontal push, supported pull, posterior assistance, optional accessory, conditioning.
- Day B: hip extension/hinge alternative, vertical push/pull, unilateral or machine legs, optional accessory, conditioning.

### Three days

- A: knee dominant + horizontal strength.
- B: hip extension + vertical strength.
- C: hypertrophy balance + conditioning.

## 3. Candidate pipeline

For each required role:

1. load reviewed eligible exercises;
2. apply equipment filter;
3. apply all hard constraints;
4. apply role/movement filter;
5. apply current-block lock/stability;
6. compute score;
7. stable-sort by score, then seeded tie-break;
8. test compatibility with selected neighbors/groups;
9. select;
10. store explanation.

## 4. Score factors

Positive:

- exact movement role;
- target muscle;
- goal fit;
- favourite/preference;
- successful recent use;
- stable main exercise;
- reviewed media/instructions;
- duration/setup fit;
- supported option when fatigue cost is high.

Negative:

- recent accessory repetition;
- high setup/transition cost;
- overlapping local/systemic fatigue;
- caution tag;
- user dislike;
- poor duration fit;
- unresolved discomfort association;
- incompatible superset position/equipment.

Hard-blocked candidate never receives a score; it is removed.

## 5. Group compatibility

A superset/triset/circuit must pass:

- no shared equipment conflict that makes gym use impractical;
- no primary heavy lift density compromise;
- no rapid floor-to-standing alternation;
- position transition cost acceptable;
- target fatigue compatible;
- rest rules valid.

## 6. Time fit

Calculate exact planned seconds.

If over target:

1. remove lowest-priority optional accessory;
2. reduce optional accessory set count within allowed range;
3. shorten optional conditioning within minimum;
4. choose equivalent lower-setup accessory;
5. show warning if no valid fit.

Never reduce primary rest below minimum.

If under target:

1. extend conditioning within cap;
2. add low-priority accessory/set if weekly balance benefits;
3. do not add junk volume merely to fill time.

## 7. Validation

Post-generation assert:

- all hard constraints;
- required roles;
- valid equipment;
- valid prescriptions;
- duration tolerance;
- no duplicate incompatible exercise;
- stable lock preserved;
- weekly balance;
- group transitions;
- explanation completeness.

Failure returns no silently invalid plan. Show which constraint prevented a valid result and allow user adjustment/manual building.

## 8. Determinism

Output identity depends on:

- normalized inputs;
- exercise seed version;
- program seed version;
- generator version;
- explicit random seed.

Persist all values. A replay test must reproduce the same plan.

## 9. Accessory regeneration

Inputs include protected IDs and prescriptions.

Only unlocked accessory roles are reselected. Post-diff validation fails if protected content changes.

## 10. Progression calculation

Progression runs after session completion on persisted performed sets.

It produces a proposal, not a mutation.

Order:

1. select comparable sets;
2. validate effort/data quality;
3. check discomfort hold;
4. apply progression rule;
5. round to configured equipment increment;
6. create reason code/text;
7. persist pending proposal;
8. apply only after user confirmation.
