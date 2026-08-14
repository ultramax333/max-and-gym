# Glute catalogue expansion checkpoint

Date: 2026-08-14

Scope: review the pinned local exercise source for useful glute alternatives, add only distinct exercises, and verify generator and replacement behavior.

## Audit result

The pinned Free Exercise DB snapshot contains 22 exercises whose primary muscle is `glutes`. Six were already present in the reviewed catalogue. Of the remaining records, most were rejected because they were stretches, unsupported physioball movements, jumping variants, or near-duplicates of an existing bridge, kickback, or squat pattern.

Two exercises add a material training option and were accepted:

- `Barbell Hip Thrust`: a distinct heavy, loadable hip-extension movement;
- `Step-up with Knee Raise`: a distinct unilateral squat/step pattern.

The `Glutes` zone now also recognizes the already-reviewed `abductors` exercises `Monster Walk` and `Thigh Abductor`. These cover band and machine hip-abduction work without adding new catalogue records.

Rejected examples include `Barbell Glute Bridge`, `Hip Lift with Band`, `Kneeling Squat`, and `Leg Lift`: they do not add enough value over the existing pool to justify extra variants. Unsupported or mobility-only records remain excluded.

## User-visible result

- reviewed catalogue: 300 to 302 exercises;
- generator-eligible catalogue: 271 to 273 exercises;
- focused `Glutes` pool: 8 to 10 relevant choices;
- replacement choices cover hinge, unilateral squat/step, abduction, cable, band, machine, barbell, and bodyweight work;
- both new exercises have two bundled local images and remain available offline.

## Data and compatibility

- exercise seed: `fedb-b0eed061e1c8-reviewed-4` to `fedb-b0eed061e1c8-reviewed-5`;
- database schema, export format, program seed, generator version, and cache version: unchanged;
- no runtime network origin, production dependency, external licence, or user-data migration added;
- source and image provenance remain the repository-pinned Free Exercise DB snapshot.

## Verification

- catalogue generation: 302 reviewed records;
- media generation: 604 bundled images;
- unit/component tests: 47 files and 186 tests passed;
- TypeScript and scoped ESLint checks passed;
- dependency, architecture, Android release, project, network, licence, asset, exercise-media, language, accessibility, and performance audits passed;
- production web build and route smoke passed;
- Android web build and bundle smoke passed.

## Limitations and rollback

The pool is intentionally finite. Exercises without appropriate source metadata, supported equipment, two usable local images, or a distinct training purpose remain excluded. Rollback requires reverting this checkpoint; no user database or backup conversion is necessary.
