# Screen blueprints

These are implementation blueprints, not optional suggestions.

## Global mobile shell

### Top area

- max&gym wordmark or contextual title;
- contextual action, usually Settings or overflow;
- offline/update/storage banner only when necessary.

### Bottom navigation

- Home;
- Train;
- Programs;
- Progress;
- Library.

During an active workout, replace normal navigation with the workout shell.

## Home

Order:

1. Resume card, if an active workout exists.
2. Next Workout hero card.
3. Quick actions: Core, Free Workout.
4. Current program compact card.
5. Last workout summary.
6. This week metrics.
7. Backup/storage warning, only when actionable.

Primary action: Start or Resume.

Empty state: “Build your first program” with Generate and Create Manually.

## Train

- Next planned;
- Quick Core;
- Free Workout;
- recent workouts;
- warm-up-only option under More.

## Program list

Tabs:

- Active;
- Drafts;
- Archived.

Card shows:

- name;
- frequency;
- duration;
- goal emphasis;
- week;
- last updated;
- Activate/Edit/More.

## Program detail

- header and status;
- weekly day cards;
- estimated minutes;
- movement/muscle summary;
- block rules;
- progression settings;
- Generate Accessories;
- Edit;
- Activate/Archive.

## Generator

Use a stepper or progressive form:

1. Schedule and duration.
2. Goal emphasis.
3. Priorities and variation.
4. Constraints.
5. Review and Generate.

Results:

- overview;
- day accordions;
- duration breakdown;
- weekly balance;
- warnings;
- explanations;
- lock/regenerate controls;
- Save Draft/Activate.

## Exercise library

Header:

- search;
- filter button;
- favourite and blocked toggles.

Grid/list card:

- thumbnail;
- name;
- movement pattern;
- equipment;
- primary muscles;
- reviewed badge;
- favourite/blocked status.

Filters use a full-screen mobile sheet.

## Exercise detail

- two-position media;
- name and tags;
- Start Position / Finish Position toggle;
- Setup;
- Execution;
- Breathing;
- Key Cues;
- Common Mistakes;
- Alternatives;
- History;
- Favourite;
- Never Suggest;
- Personal Note;
- Source and licence under More.

## Active workout

### Sticky header

- back/pause;
- session name;
- elapsed time;
- progress;
- finish.

### Exercise area

- exercise image;
- exercise name;
- group indicator;
- previous performance strip;
- instructions drawer;
- replace/more.

### Set table/card list

Columns/fields:

- set number/type;
- previous;
- target;
- actual load;
- actual repetitions/time/distance;
- effort;
- complete status.

At narrow widths, use stacked set cards rather than compressed columns.

### Sticky bottom action

- Complete Set;
- while resting: timer, add time, skip;
- next exercise cue.

### Sheets

- Instructions;
- Replace Exercise;
- Plate Calculator;
- Add Set;
- Exercise Note;
- Session Note;
- Discomfort.

## Workout summary

- completion status;
- duration;
- completed sets;
- records;
- skipped/changed work;
- session effort;
- discomfort summary;
- notes;
- pending progression proposals;
- Save/Done.

## Progress overview

- time-range selector;
- training frequency;
- duration;
- sets/volume;
- recent records;
- body-weight trend;
- shortcuts: Exercises, Body, Photos.

Every chart has a text summary.

## Body and photos

Tabs:

- Measurements;
- Photos.

Photo grid supports optional blur. Comparison selects pose and two dates.

## Settings

Sections:

- Training;
- Timers and Feedback;
- Constraints;
- Storage and Backup;
- Diagnostics;
- About and Licences;
- Delete Data.

## Diagnostics

Cards:

1. Build identity.
2. Database and schema.
3. Progressive Web App and cache.
4. Storage and capabilities.
5. Active-session health.
6. Latest migration/import/export status.
7. Self-test.
8. Recent redacted errors.
9. Export Diagnostics.

No sensitive training values appear.
