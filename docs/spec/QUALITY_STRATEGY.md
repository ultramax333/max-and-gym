# Quality strategy

## 1. Quality pyramid

### Domain unit tests

High volume, fast:

- duration estimation;
- candidate filtering/scoring;
- hard exclusions;
- progression rules;
- personal-record calculations;
- estimated one-repetition maximum;
- backup validation;
- redaction;
- integrity rules.

### Repository/database tests

- CRUD;
- transactions;
- idempotency;
- migrations;
- active-session invariant;
- media references;
- import staging;
- diagnostic retention.

### Component tests

- set input/complete/undo;
- rest controls;
- filters;
- program editor;
- error states;
- photo workflow;
- diagnostics.

### End-to-end tests

Priority journeys:

- onboarding;
- install/static boot;
- start/log/rest/refresh/finish;
- offline workout;
- generate/activate program;
- substitute;
- add photo;
- export/clear/restore;
- service-worker update while active;
- diagnostic self-test/export.

### Manual Android checks

Automated tests cannot fully replace:

- install experience;
- safe-area behavior;
- keyboard overlays;
- vibration/audio;
- wake lock;
- background/foreground;
- camera/gallery;
- file download/import;
- actual offline use.

## 2. Test data

Use anonymous deterministic fixtures:

- no real names;
- no real notes;
- artificial loads/repetitions;
- generated placeholder images;
- several schema versions;
- edge cases and corrupt archives;
- multiple timer states.

## 3. Timer testing

Use fake clocks for unit tests and controlled real clocks for end-to-end.

Test:

- start;
- pause;
- resume;
- add/subtract;
- background elapsed;
- expiry;
- restore;
- owner mismatch;
- cancelled workout;
- app update;
- unavailable audio/vibration.

## 4. Generator property tests

Across representative seeds and profiles assert:

- no hard exclusion;
- only available equipment;
- required movement coverage;
- no duplicate incompatible assignment;
- duration bounds;
- deterministic result;
- locked main lift preservation;
- valid alternative pool;
- no rapid floor/standing circuit.

## 5. Migration testing

For every schema version:

- prior fixture opens;
- migration runs once;
- counts/relations preserved;
- restart does not rerun;
- induced failure leaves recovery;
- future unknown version is rejected safely;
- downgrade behavior documented.

## 6. Backup testing

- export manifest;
- checksum validation;
- media inclusion;
- large-photo behavior;
- Replace;
- Merge;
- duplicate detection;
- corrupt ZIP;
- path traversal;
- unsupported version;
- insufficient quota;
- post-import integrity;
- complete round trip after clearing data.

## 7. Offline testing

After initial load:

- Home;
- active workout;
- Programs;
- reviewed exercise details and images;
- Progress from local data;
- Settings;
- Diagnostics;
- backup export.

Network-blocked tests confirm no hidden dependency.

## 8. Service-worker testing

- first install;
- update waiting;
- update prompt;
- active-workout deferral;
- post-workout apply;
- stale cache cleanup;
- offline shell;
- no user media cache;
- visible build change.

## 9. Accessibility testing

Automated:

- serious/critical violation scan;
- labels;
- roles;
- contrast where measurable.

Manual:

- keyboard;
- focus;
- screen reader smoke;
- reduced motion;
- high text zoom;
- touch targets;
- drag alternatives;
- chart summaries.

## 10. Visual regression

Capture critical states at:

- 360 × 800;
- 412 × 915;
- desktop.

Screens:

- Home;
- active set;
- rest;
- exercise detail;
- program generator result;
- progress;
- photo comparison;
- diagnostics;
- error/recovery.

Approve intentional changes with evidence.

## 11. Performance

Track:

- production bundle;
- route chunks;
- image output;
- initial load;
- cached launch;
- set-log interaction;
- large history query;
- photo decode/compression;
- backup build.

Task 00 establishes baseline. Later checkpoints may not regress materially without explanation.

## 12. Definition of done

A story is done only when:

- requirement ID is implemented;
- tests exist;
- failure states exist;
- diagnostics exist for critical failure;
- accessibility is checked;
- no unexplained network origin;
- documentation updated;
- checkpoint report includes evidence.

## 13. Release blocking defects

- data loss or duplication;
- failed migration;
- unrecoverable active workout;
- hard-excluded generated exercise;
- corrupt backup/restore;
- personal-data network request;
- blank production page;
- forced update during workout;
- critical accessibility blocker;
- missing licence obligation.
