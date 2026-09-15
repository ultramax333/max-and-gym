# Exercise data and media

## 1. Source

Use Free Exercise DB as the upstream seed source. It supplies public-domain-style structured exercise records, English instructions, equipment/muscle fields, and paired images.

Do not fetch this dataset at runtime. Import and curate it during development, then commit the processed subset and optimized assets.

## 2. Initial curated scope

Target roughly 150–220 high-value exercises covering a full commercial gym:

- barbell, dumbbell, cable, machine, body-weight, bands, bench, cardio machines, sled, and carries;
- squat, hinge, horizontal/vertical push and pull, single-leg, knee flexion/extension, hip extension, calves, arms, delts, core, mobility, and low-impact conditioning;
- common substitutions for each major movement pattern;
- enough variation to support advanced programming without overwhelming search.

Do not import obscure duplicates simply to increase the count.

## 3. Curation requirements

Every imported exercise must be reviewed for:

- clear English name;
- correct primary/secondary muscle tags;
- equipment tags;
- movement pattern;
- metric type;
- usable start/end images;
- readable setup and execution instructions;
- obvious instruction errors or formatting defects;
- duplicate/near-duplicate identity;
- generator eligibility;
- exclusion/caution tags;
- substitution relationships.

Source instructions may be edited for clarity, brevity, and consistency. Do not add unsupported medical or injury-prevention claims.

## 4. Instruction template

Each exercise detail should support:

1. **Setup** — equipment and starting position.
2. **Execution** — short numbered steps.
3. **Breathing** — concise cue where useful.
4. **Common mistakes** — 2–4 observable errors.
5. **Notes** — personal user notes, separate from seed content.

## 5. Media processing

For each seeded exercise:

- retain two demonstration frames when available;
- create thumbnail and detail variants;
- preserve aspect ratio;
- use modern compressed images with a compatible fallback if required;
- strip unnecessary metadata;
- use stable hashed or namespaced filenames;
- record attribution/source metadata in the build dataset;
- ensure all paths work under the GitHub Pages subpath.

Do not precache all full-resolution images. Cache the shell, thumbnails needed by visible screens, and on-demand assets through a bounded runtime cache.

## 6. Local custom media

Custom exercises may have:

- one local image in version 1;
- local-only storage;
- user-editable replacement/deletion.

Exercise video support is deferred. Enforce size and MIME-type limits and compress images before storage.

## 7. Generator exclusions

Mark these tags ineligible by default:

- `bunny-jump`
- `burpee`
- `rapid-floor-to-standing`
- `rapid-plank-to-standing`
- `high-impact-transition`

A movement may remain visible in the library for completeness only if it is clearly disabled from automatic generation. For this personal project, omitting these movements entirely is acceptable.

## 8. Data pipeline

Create a repeatable development pipeline:

1. pin an upstream Free Exercise DB revision;
2. read source JSON;
3. apply a curated allowlist and overrides;
4. validate against the max&gym exercise schema;
5. detect duplicate names/images;
6. process images;
7. emit a versioned local dataset;
8. generate a curation report with counts and warnings;
9. run tests;
10. update source attribution.

The application records the seed revision so future updates can be migrated without overwriting user edits.

Reviewed-7 applies 16 documented metadata corrections from
`data/exercise-classification-overrides.json` during deterministic catalogue
generation. IDs, source pins, local media and historical snapshots remain stable.
`audit-exercise-assets.mjs` also runs the classification invariant audit; it does
not claim exhaustive biomechanical or medical validation. Resistance tags and
auxiliary setup stations are distinct. Library muscle filters target primary
muscles unless the user explicitly enables secondary muscles.

Reviewed-8 adds five distinct back movements from the existing pinned source:
Superman (controlled floor extension, library-visible but excluded from automatic
strength-session generation), Weighted Ball Hyperextension (ball-supported loaded
extension), Lying T-Bar Row (chest-supported machine), Seated One-arm Cable Pulley
Rows (unilateral seated cable), and Shotgun Row (unilateral standing low cable).
All ten start/end images are committed locally. Each exercise retains its source
primary muscle and apparatus classification; secondary lower-back involvement
does not make it eligible for a Lower back session. No database, export or cache
schema change is needed: the reviewed seed version refreshes the catalogue while
preserving user preferences and custom exercises.

## 9. Attribution screen

The About page lists:

- max&gym source license;
- RepQuest base project and license;
- Free Exercise DB and its license/status;
- application version;
- link to the public source repository.
