# Product specification

## 1. Product definition

max&gym is a personal training application for one advanced gym user. It must combine the speed of a focused workout logger with enough structure to generate and adapt two- or three-day strength/hypertrophy programs.

The application is local-first. Once installed and opened successfully, the core experience must not depend on a server or a network connection.

## 2. Product promise

> Open the app, see the right session, train with minimal friction, preserve every result, and understand the next recommendation.

## 3. Primary user

- advanced resistance-training user;
- full commercial-gym access;
- trains two or three times per week;
- combines strength, hypertrophy, and conditioning;
- wants exercise variety without losing measurable progression;
- uses an Android phone during training;
- has discomfort with bunny jumps and rapid floor-to-standing movements;
- wants body measurements and private progress photos;
- has no technical background and should not need to manage databases or servers.

## 4. Core outcomes

The user can:

1. install max&gym from GitHub Pages;
2. complete onboarding in under three minutes;
3. generate a two- or three-day program for 40- or 60-minute sessions;
4. launch a 10- or 15-minute core session;
5. follow a concise warm-up;
6. log loads, repetitions, effort, set type, notes, and discomfort;
7. use automatic rest timing;
8. resume after interruption without duplicate data;
9. substitute an exercise safely and preserve history;
10. receive an explainable progression proposal;
11. inspect training and body progress;
12. store and compare local progress photos;
13. export and restore a complete backup;
14. export a separate diagnostic package when something fails;
15. use all priority-zero training functions offline.

## 5. Version-1 functional scope

### 5.1 Onboarding and preferences

Collect only fields needed to operate:

- weekly frequency: two or three;
- preferred main duration: 40 or 60 minutes;
- preferred core duration: 10 or 15 minutes;
- goals and their emphasis;
- level, preselected Advanced;
- equipment profile, preselected Full Gym;
- unit system, preselected Metric;
- exercise and movement exclusions;
- low-back-comfort warm-up preference;
- body and photo tracking preference;
- sound/vibration/wake-lock preference;
- explanation of local storage, persistence, and backup.

Request persistent browser storage only after explaining why.

### 5.2 Home

Home is action-oriented, not a dense dashboard.

Required content:

- resume active workout, when present;
- next planned workout;
- start button;
- current program and block week;
- duration estimate;
- quick core action;
- free-workout action;
- last workout summary;
- this-week completion count;
- backup status;
- local/offline and storage warnings only when actionable.

### 5.3 Train

Train supports:

- next planned session;
- free workout;
- quick core;
- warm-up-only session;
- active workout;
- completed-workout summary.

### 5.4 Programs

Program functions:

- generate;
- create manually;
- view;
- edit;
- duplicate;
- activate;
- archive;
- lock main exercises;
- regenerate accessories only;
- switch session duration;
- reorder exercises;
- create supersets or circuits;
- inspect weekly movement and muscle distribution;
- inspect estimated duration;
- assign progression method;
- assign alternatives.

Program history must remain intact when a program is edited or archived.

### 5.5 Exercise library

Each reviewed exercise includes:

- English name and aliases;
- category and movement pattern;
- equipment;
- primary and secondary muscles;
- body position;
- transition and impact tags;
- two-position image;
- setup;
- concise execution;
- breathing;
- primary cues;
- common mistakes;
- range-of-motion note;
- alternatives;
- source and licence;
- history and records;
- favourite and never-suggest controls;
- custom note.

Only reviewed exercises may be automatically generated. Imported-but-unreviewed items remain hidden from automatic selection.

### 5.6 Active workout

The active workout is the highest-priority product area.

Required:

- session name, elapsed time, progress, pause, finish;
- exercise name, demonstration, instructions, previous comparable result;
- planned and actual load;
- planned and actual repetitions;
- Repetitions in Reserve or Rating of Perceived Exertion;
- set type;
- duration or distance when relevant;
- exercise notes and session notes;
- discomfort flag;
- automatic save;
- complete-set action;
- undo;
- rest timer;
- add/subtract time;
- skip rest;
- supersets/trisets/circuits;
- replace, skip, reorder, add set, add exercise;
- plate calculator;
- estimated one-repetition maximum;
- personal-record indication;
- exact recovery after refresh or closure.

Supported set types:

- warm-up;
- working;
- top set;
- back-off;
- drop set;
- as-many-repetitions-as-possible;
- failure;
- timed;
- distance;
- bodyweight;
- assisted.

### 5.7 Core sessions

Core sessions:

- 10 or 15 minutes;
- gym/cable, floor, standing, or mixed;
- timed or set-based;
- position clustering;
- anti-extension;
- anti-rotation;
- lateral stability;
- controlled trunk flexion;
- loaded carry;
- no rapid floor-to-standing transitions;
- alternatives by function.

### 5.8 Warm-up

Default sequence:

1. two or three minutes of easy bike, treadmill, or elliptical;
2. optional low-back-comfort sequence;
3. movement-specific ramp-up sets.

The sequence is editable and skippable. It must not be described as treatment. Long passive stretching before heavy work is not the default.

### 5.9 Progression

For each programmed exercise:

- progression method;
- latest comparable result;
- next recommendation;
- explanation;
- accept, edit, or reject;
- no silent program mutation.

Version-1 methods:

- double progression;
- fixed increment;
- top-set/back-off;
- time-based conditioning;
- manual hold;
- deload suggestion.

### 5.10 Progress

Views:

- workout history;
- exercise history;
- personal records;
- weekly/monthly frequency;
- sets and volume;
- duration;
- muscle/movement distribution;
- estimated one-repetition maximum trend;
- body weight;
- measurements;
- progress photos.

Charts require a text summary and cannot use colour as the only encoding.

### 5.11 Body measurements and photos

Measurements:

- body weight;
- waist;
- chest;
- hips;
- upper arm;
- thigh;
- optional custom measurement.

Photos:

- front, side, back, custom;
- date, optional weight, optional note;
- local image selection or camera;
- local re-encoding and compression;
- thumbnail;
- optional blurred thumbnails;
- side-by-side comparison;
- delete;
- backup inclusion;
- no upload.

### 5.12 Backup and recovery

Personal-data backup:

- one versioned `.maxgym` ZIP;
- structured data;
- local photos and custom media;
- manifest;
- checksums;
- record counts;
- Replace and Merge import modes;
- pre-import snapshot;
- transactional or staging import;
- full restore after browser data deletion.

Diagnostic export:

- separate `.maxgym-diagnostics.zip`;
- no photos, notes, measurements, loads, repetitions, or names by default;
- build and schema identity;
- redacted diagnostic events;
- self-test results;
- feature/capability status;
- known network origins.

### 5.13 Settings and diagnostics

Settings includes:

- training defaults;
- timer settings;
- sound/vibration/wake lock;
- movement constraints;
- theme information;
- storage usage and persistence;
- backup;
- diagnostics;
- application/build version;
- third-party notices;
- clear-data controls.

Diagnostics includes:

- app version;
- Git commit;
- build date;
- database/export/seed/cache versions;
- service-worker state;
- storage estimate;
- active-session summary without sensitive values;
- latest migration result;
- integrity check;
- recent redacted errors;
- self-test;
- diagnostic export.

## 6. Explicitly out of scope

- account or login;
- cloud synchronization;
- backend;
- coach or multi-user mode;
- nutrition;
- barcode scanning;
- social feed;
- leaderboards;
- payments;
- subscriptions;
- wearable integration;
- camera-based form analysis;
- automatic repetition counting;
- remote artificial intelligence;
- exercise video library;
- custom multi-media galleries;
- public sharing;
- medical diagnosis or treatment.

## 7. Quality attributes

### Reliability

No completed set may disappear or duplicate under normal retries, refreshes, or double taps.

### Performance

Logging a set must feel immediate. Heavy media is lazy-loaded. The initial bundle must not contain the entire full-resolution exercise library.

### Privacy

No personal data leaves the device without an explicit user export.

### Accessibility

The application targets Web Content Accessibility Guidelines 2.2 level AA.

### Maintainability

Features are isolated, repository access is explicit, migrations are tested, errors have stable codes, and every checkpoint leaves a known-good state.

### Explainability

The generator and progression engine can explain every selection and change.

## 8. Success criteria

Version 1 is successful when Max can use only max&gym for four consecutive weeks and can:

- complete workouts offline;
- recover from interruptions;
- understand generated programs and progression;
- back up and restore all data including photos;
- provide a diagnostic export that isolates a failure without exposing personal training data.
