# Max & Gym 1.6.0 release notes

## Generator

- Bodyweight exercises are now excluded whenever `body only` is unchecked, including generation and manual replacements.
- Single sessions and weekly programs offer Strength, Hypertrophy and Endurance goals.
- Goal-specific sets, repetitions and execution estimates remain coherent with the selected duration and explicit recovery time.
- Glutes sessions can use six curated non-cable compound movements already present in the reviewed library, without changing their source anatomy metadata.
- Generator compatibility advances to `deterministic-v6`; the reviewed exercise seed advances to `fedb-b0eed061e1c8-reviewed-6`.

## Saved sessions

- `Save to My sessions` stores a generated one-day session as a reusable local template.
- Saved sessions have a dedicated Programs tab and a direct entry from Train.
- A saved session can be restarted directly without activating it as a weekly program.
- Saved sessions retain rename, exercise editing, reordering, duplication and archive support.

## Active workout controls

- A persistent workout dock appears outside the active workout screen.
- The dock resumes the current session or finishes it after explicit confirmation.
- Completed sets remain saved, unfinished sets remain incomplete, and the summary retains actual elapsed time.
- Mobile positioning accounts for the Android safe area and the bottom navigation.

## Compatibility

- Application version: `1.6.0`.
- Database schema: `8` (unchanged).
- Export format: `2` (unchanged).
- Cache version: `5` (unchanged).
- No network origin, account requirement or personal-data migration is introduced.
