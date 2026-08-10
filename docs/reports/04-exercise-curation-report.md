# CP4 exercise curation report

Date: 2026-08-06

## Source

- Upstream: Free Exercise DB
- Repository: https://github.com/yuhonas/free-exercise-db
- Immutable revision: b0eed061e1c8
- Licence: Unlicense
- Raw source records: 873
- Reviewed local seed: 300 exercises

## Pipeline

The development pipeline reads the pinned local upstream JSON, applies the supported
equipment and movement scope, excludes unsafe rapid-impact patterns, normalizes
identifiers/tags, validates attribution and local media paths, then emits the
reviewed seed and generated curation summary. The original 180-item automatic seed is
supplemented by 120 explicitly reviewed, useful movements across the supported body
areas. Redundant cosmetic variants and unsuitable advanced movements remain excluded.

Every reviewed record contains a stable source ID/revision, source URL, licence,
instructions, cue/mistakes, equipment, muscles, movement/position tags and two local
media paths. The source pin and generated seed version are recorded in SOURCE_PINS.json
and THIRD_PARTY_NOTICES.md.

## Safety and eligibility

- 300 reviewed records are eligible by default.
- Names matching burpee, bunny jump, rapid floor/plank transition or high-impact
  transition are excluded before seed generation.
- A user Never Suggest preference overrides generator eligibility without deleting the
  library item.
- Custom exercises are local-only and may include one bounded JPEG, PNG or WebP image.

No Workout.cool code, assets or source files were imported. THIRD_PARTY_CODE_MAP.md
therefore remains unchanged.
