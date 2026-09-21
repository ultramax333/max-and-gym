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

## 11. Quick-session equipment and preference planning

- Quick-session working sets may vary from two to five according to duration, goal, exercise role and contextual rating; three is not a fixed default.
- The duration validator still includes execution, recovery, setup and transitions and must remain within the documented tolerance.
- Selected exercises are grouped by their primary equipment tag with stable ordering inside each group.
- A contextual rating is resolved before generation by exercise ID, body area and goal. It affects ranking only inside that exact context. A high non-strength rating may extend the optional upper repetition target by one; it never changes a completed record or applies a load automatically.
- Normalized rating inputs are sorted and included in the identity hash so generation remains reproducible.

## 12. Classification and replacement consistency (generator v10)

- Focus matching uses primary muscles or explicit reviewed focus annotations, never incidental secondary involvement.
- Availability tags are cumulative: a band-assisted pull-up requires both bands and bodyweight enabled. Auxiliary support stations remain visible at setup.
- Generation and substitution always reject intrinsic high-impact transition tags, even if the input block list is empty.
- Generator preview and active-workout alternatives share one selection policy. A focused session stays within its focus; broad and legacy sessions additionally preserve the exercise's primary/reviewed target overlap. Matching a movement pattern alone is insufficient.
- Generated and saved generated sessions copy equipment and exclusions into an optional, unindexed workout selection snapshot. Legacy sessions do not invent missing availability.
- Corrected isolation roles can reduce estimated duration. If the quick planner is below its 90% lower bound, it may fill an existing exercise up to five working sets, deterministically, without exceeding the 110% upper bound. Recovery and repetition ranges are unchanged; infeasible plans still fail validation.

## 13. Back focus and post-session explanations (generator v11)

- The old `back` zone ID remains stable for saved plans and contextual ratings; its visible name is Full back. Upper back targets middle back, lats and traps; Lower back targets primary lower-back exercises only. Incidental secondary involvement is not sufficient.
- Lower back quick sessions are limited to 15–30 minutes. The longer duration choices are disabled rather than filling a focused session with unrelated exercises. Full back remains available for 35–60 minutes.
- Proposals appear after a **saved-program** workout with progression rules. A directly generated one-off session saves loads and repetitions in history but creates no proposal. The summary says so instead of offering an empty link.
- Each proposal explains logged working sets, the saved target and the optional future default. Accepting a load proposal updates the saved program prescription, not the completed workout; deciding later or dismissing makes no change. The owner may edit the proposed load before accepting it.

## 14. Opt-in secondary lower-back work (generator v12)

- `lower-back` remains strict: primary lower-back exercise only, 15–30 minutes. The separate `lower-back-mixed` choice combines at least one direct lower-back exercise with at least one reviewed movement whose **source secondary** muscle is lower back. Its visible label and each exercise badge distinguish direct from secondary work.
- Only the existing Romanian Deadlift, Kettlebell One-Legged Deadlift and Bent Over One-Arm Long Bar Row enter this secondary pool. The generic secondary tag alone is insufficient: squats, abdominal movements, side laterals, cable deadlifts and glute pull-throughs are not reclassified. Hard exclusions, equipment availability, favourites and Never Suggest still apply before selection.
- The mixed choice offers 15–45 minutes, keeping one back-extension family member and at most one heavy barbell hinge per session. Fifty- and sixty-minute requests return clear invalid-input guidance to use Full back rather than pad the low-back focus with repeated variants or additional lumbar loading.
- Generation fails closed if either direct or secondary pool is unavailable. Preview and active-workout alternatives preserve the last remaining exercise of each class; explicit saved-program editing still remains user-controlled. The generator version advances to v12 so existing v11 snapshots remain identifiable.

## 15. Full-back coverage balancing (generator v13)

- When the reviewed **Hyperextensions (Back Extensions)** exercise is eligible and its `other` equipment class is available, a Full back quick session uses it as the direct lower-back coverage anchor. Its Back-extension bench station and local start/end photos remain visible. Never Suggest, explicit exclusions and equipment availability still win; the generator does not force the exercise when those constraints reject it.
- Full back time-fitting assigns one additional working set, when the upper duration bound permits it, to a selected exercise covering one of the least-represented primary back muscles. Further time-fit sets use the same least-covered-first ordering. The rule never exceeds five working sets, shortens recovery or adds an unrelated exercise.
- The generated explanation identifies both the bench-extension anchor and the balancing set. Other body areas and the strict/mixed lower-back modes retain their existing behavior. Generator identity advances to v13 so v12 snapshots remain reproducible.

## 16. Personal equipment and gym access planning (generator v14)

- An exercise may have several required equipment stations and one explicitly selected primary station. The primary station controls grouping; all required stations remain visible in preview and during the workout.
- Personal catalogue corrections override seed equipment without mutating the reviewed source data. The user can restore the catalogue defaults at any time. These preferences are local and included in backup/export through the existing exercise-preference store.
- The user may mark access as normal, limited or difficult, and record whether the exercise occupies one or two stations simultaneously. During a locally estimated busy period, difficult or two-station candidates receive a strong ranking penalty; limited-access candidates receive a smaller penalty. Moderate periods apply smaller penalties, and quiet periods apply none.
- Lausanne Tunnel, Lausanne Gare and Flon have separate local historical occupancy profiles. `Auto` evaluates the selected club and local time; `Quiet now` and `Busy now` are explicit overrides when reality differs. No live occupancy, account, location or network access is required.
- Access difficulty affects ranking rather than becoming a hard exclusion. The planner may retain a penalized movement when it is needed for a coherent session and explains that decision in the preview.
- Gym context and personal equipment/access metadata participate in deterministic generation and workout snapshots. Generator identity advances to v14 so v13 plans remain identifiable.
