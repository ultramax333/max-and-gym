# Max & Gym 1.7.0 release notes

## Smarter session rotation

- Quick generation remembers the four latest generated sessions for each body area.
- Recently proposed exercises receive a deterministic score penalty instead of becoming unsafe hard exclusions.
- Favourites, Never Suggest, equipment, body-area relevance and duration constraints remain authoritative.
- Repetition is still allowed when the eligible pool has no equally coherent alternative.

## Machine occupied controls

- `Do later` moves to the next unfinished exercise without changing any recorded set.
- `Choose alternative` opens a full-screen, local list of compatible exercises.
- Replacement is allowed only before the first set of that exercise is logged.
- The original exercise identity and replacement reason remain stored in the session snapshot.
- Sets, repetition targets and recovery are kept; load uses local history/defaults or safely starts at 0 kg.

## Session preparation and summary

- Generated-session preview now shows work, rest, setup/movement and total-versus-target time.
- Exercises can be moved earlier or later with accessible buttons before starting.
- The completed-workout summary shows completed exercises, incomplete sets, per-exercise volume, last logged values and visible replacements.
- Historical values remain informational; no automatic load increase is applied.

## Compatibility

- Application version: `1.7.0`.
- Generator version: `deterministic-v7`.
- Database schema: `8` (unchanged).
- Export format: `2` (unchanged).
- Exercise seed: `fedb-b0eed061e1c8-reviewed-6` (unchanged).
- Cache version: `5` (unchanged).
