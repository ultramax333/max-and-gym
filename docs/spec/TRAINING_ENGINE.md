# Training and program engine

## 1. Purpose

Generate coherent 2- or 3-day programs and duration-specific sessions without a remote artificial-intelligence service. The engine must be deterministic, explainable, testable, and user-overridable.

It is a training organizer, not a medical or diagnostic engine.

## 2. Core principles

- Main movement anchors remain stable for 4–6 weeks.
- Accessory variation is controlled, not random.
- Every generated exercise must have a clear program role.
- Duration is a hard constraint, not a cosmetic label.
- Strength, hypertrophy, and conditioning are blended according to user-selected priorities.
- The 2-day and 3-day programs use full-body exposure with rotating emphasis.
- Exercise pain/exclusion tags override all scoring.
- Progression is proposed and confirmed by the user.
- History is never rewritten when a program changes.

## 3. Definitions

- **Repetitions in reserve (RIR):** estimated repetitions that could still be completed before failure.
- **Rating of perceived exertion (RPE):** subjective effort scale, commonly 1–10.
- **Estimated one-repetition maximum (e1RM):** calculated estimate of the maximum load for one repetition; not a measured maximum.
- **Hard set:** a working set close enough to failure to count toward the programmed training stimulus. Do not infer it solely from completed repetition count when effort data is missing.

## 4. Generator inputs

- weekly sessions: 2 or 3;
- session duration: 40 or 60 minutes;
- program block: default 6 weeks;
- strength/hypertrophy/conditioning priority;
- full-gym equipment;
- preferred/favourite exercises;
- never-suggest exercises;
- excluded movement tags;
- muscle priorities;
- variation preference;
- recent session history;
- accepted/rejected progression proposals;
- optional current discomfort flag and exercise-specific discomfort history.

## 5. Hard exclusions

The generator must reject exercises tagged as:

- bunny jump;
- burpee;
- rapid floor-to-standing;
- rapid plank-to-standing;
- high-impact transition;
- user never-suggest;
- equipment unavailable;
- currently pain-associated when the user has chosen to suppress that exercise.

Do not reintroduce an excluded movement through a conditioning circuit or warm-up.

## 6. Weekly structures

### Two sessions

Use full-body A/B with different emphases.

**A: squat + horizontal push emphasis**

- primary knee-dominant lift;
- primary horizontal push;
- supported pull;
- hip-extension or knee-flexion assistance;
- optional arms/delts/core;
- low-impact conditioning if time allows.

**B: hinge/hip-extension + vertical pull/push emphasis**

- primary hinge or selected alternative;
- vertical push or secondary press;
- vertical pull;
- unilateral leg or machine leg work;
- optional arms/delts/core;
- low-impact conditioning if time allows.

Ensure all major movement patterns receive repeated exposure across the two sessions without forcing maximal volume into a single day.

### Three sessions

Use rotating full-body A/B/C.

- A: strength bias — squat and horizontal press.
- B: strength bias — hinge/hip extension and vertical pull/push.
- C: hypertrophy and conditioning bias with machine/support options.

Avoid a rigid push/pull/legs split because missed days would create uneven exposure for a user training only two or three times.

## 7. Session time budgeting

Total advertised duration includes:

- warm-up;
- specific ramp-up sets;
- working sets;
- programmed rest;
- realistic transitions;
- conditioning/cool-down when present.

Use configurable estimates based on actual history when available.

Initial assumptions:

- general warm-up: 4–6 minutes for a 40-minute session; 6–8 minutes for a 60-minute session;
- specific warm-up/ramp set: 30–45 seconds plus rest;
- working set execution: 25–50 seconds depending on repetition target;
- equipment transition: 30–75 seconds;
- superset transition: 15–30 seconds;
- conditioning: 4–8 minutes in 40-minute sessions; 6–12 minutes in 60-minute sessions when conditioning priority permits.

The generator iteratively removes the lowest-priority accessory or shortens optional conditioning until the estimate is at or below target. It must not silently shorten primary rest below the programmed minimum.

Acceptance tolerance: predicted total should normally fall within ±10% of the selected duration.

## 8. Exercise selection score

After hard exclusions, rank candidates by a weighted score:

- movement-pattern fit;
- muscle/role fit;
- goal fit;
- equipment availability;
- preference/favourite;
- historical progression quality;
- fatigue cost;
- setup/transition cost;
- recent variation penalty;
- pain/caution penalty;
- compatibility with neighbouring superset exercises.

The scoring explanation should be available in development logs/tests and summarized for the user as plain language when generating or substituting.

## 9. Strength prescriptions

Typical primary-lift defaults, adjustable by exercise:

- 3–5 working sets;
- 2–6 repetitions;
- target 1–3 repetitions in reserve;
- 2–4 minutes rest;
- full range of motion that is controlled and symptom-free;
- optional top-set plus back-off structure for suitable lifts.

Do not prescribe true maximal attempts by default. Personal-record detection can identify rep/load records without requiring one-repetition-maximum testing.

## 10. Hypertrophy prescriptions

Typical defaults:

- 2–4 working sets;
- 6–15 repetitions for most movements, broader where appropriate;
- target 1–3 repetitions in reserve;
- 60–150 seconds rest depending on exercise and superset design;
- supported or machine variations may be preferred when fatigue cost threatens session quality or the duration target.

## 11. Conditioning prescriptions

Default modalities:

- stationary bike;
- incline treadmill walk;
- elliptical;
- sled push or drag;
- controlled carries.

Rower is optional rather than default due to possible low-back sensitivity. Jumping, burpees, bunny jumps, and fast floor transitions are excluded.

Formats:

- steady moderate effort;
- short work/recovery intervals;
- density blocks using non-conflicting machine/accessory movements;
- carries or sled intervals.

Conditioning never precedes a primary strength lift unless explicitly chosen.

## 12. Core-session generator

### 10 minutes

- 1 minute preparation;
- 4 movements;
- 2 controlled rounds;
- anti-extension, anti-rotation, lateral stability, and one controlled dynamic trunk/hip movement;
- minimal position changes and no rapid floor-to-standing transition.

### 15 minutes

- 2 minutes preparation;
- 4–5 movements;
- 2–3 rounds or stations;
- gym cable/carry options where useful;
- controlled transitions.

The generator should offer `Floor`, `Gym`, and `Minimal transitions` filters.

## 13. Warm-up generation

Default sequence:

1. 2–4 minutes easy cyclical activity;
2. brief dynamic mobility relevant to the session;
3. optional low-back-aware gentle mobility preset;
4. movement-specific ramp sets for the first primary lift;
5. one smaller ramp sequence for a second heavy lift when needed.

The optional low-back-aware preset may include slow, symptom-free movements such as breathing, pelvic control, gentle cat-camel, bird dog, glute bridge, or hinge-to-wall practice. These are user-disableable and must not be described as treatment.

Long static stretches are not the default immediately before strength work. A short user-selected gentle stretch may be included when it subjectively helps and does not provoke symptoms.

## 14. Progression rules

### Double progression

For accessories and many hypertrophy lifts:

- keep load stable while repetitions progress within the range;
- when all prescribed sets reach the top of the range at the target effort for two comparable sessions, propose the smallest available load increase;
- after increasing load, return toward the lower end of the repetition range.

### Load-step progression

For suitable primary lifts:

- when all prescribed repetitions are achieved within effort target and technique/pain notes are acceptable, propose the smallest configured increment;
- if a target is missed once, hold and retry;
- if comparable targets are missed twice, propose a small load or volume reduction rather than forcing an increase;
- user confirmation is required.

### Timed/distance progression

Progress only one main variable at a time:

- work duration;
- distance;
- recovery duration;
- resistance/level.

### Deload proposal

Propose, never force, when several signals align:

- repeated performance decline;
- repeated high perceived effort above target;
- rising discomfort notes;
- repeated high session effort or poor recovery feedback when explicitly entered;
- completion of a hard block.

A deload normally reduces volume first and may reduce load. The exact proposal remains editable.

## 15. Estimated one-repetition maximum

Use one documented formula consistently, with a setting to change later. Calculate only from suitable completed weight/repetition sets. Flag lower confidence at high repetition counts. Never use estimated one-repetition maximum as a medical or exact capability statement.

## 16. Variety rules

The user prefers variation, but random change is not progression.

- Main lifts: retain for 4–6 weeks unless pain, equipment, preference, or performance justifies replacement.
- Secondary compounds: retain 3–6 weeks.
- Accessories: may rotate every 2–4 weeks based on variation setting.
- Do not repeat the exact same accessory pairing in every generated session when equally valid options exist.
- Avoid changing more than one major variable per exercise at once.
- Show `Why this changed` for every generator-driven replacement.

## 17. Discomfort behavior

A discomfort entry never creates a diagnosis or automatic medical decision.

Conservative options may include:

- hold the next load proposal;
- remove one optional accessory set;
- choose a supported or machine substitution;
- shorten optional conditioning;
- extend the warm-up;
- stop the current exercise.

When discomfort is linked to an exercise, show `Continue`, `Reduce load`, `Substitute`, and `Stop exercise`. The application must not tell the user that a movement is medically safe.

## 18. Determinism and tests

Given the same profile, seed revision, history, and random seed, the generator must return the same output. Store the generator version and settings snapshot with each generated program.

Tests must cover:

- 2-day and 3-day balance;
- 40- and 60-minute duration bounds;
- 10- and 15-minute core duration bounds;
- all hard exclusions;
- unavailable-equipment rejection;
- stable main-lift behavior;
- controlled variation;
- progression accept/reject flows;
- low-back sensitivity substitutions;
- no duplicate or incompatible superset assignments.
