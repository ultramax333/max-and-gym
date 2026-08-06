# Codex tasks

Execute the construction tasks exactly one at a time, in numeric order:

1. `00_AUDIT_BASE_AND_DONOR.md`
2. `01_STABILIZE_AND_DIAGNOSTICS.md`
3. `02_DESIGN_SYSTEM_AND_SHELL.md`
4. `03_CORE_WORKOUT_VERTICAL_SLICE.md`
5. `04_EXERCISE_LIBRARY.md`
6. `05_PROGRAM_BUILDER.md`
7. `06_GENERATOR_AND_SEED_PROGRAMS.md`
8. `07_PROGRESS_PHOTOS_BACKUP.md`
9. `08_OFFLINE_HARDENING_RELEASE.md`

Each construction task ends with a checkpoint pull request and a mandatory stop.

`90_DIAGNOSTIC_AUDIT.md` is an on-demand incident task. It is not part of the sequence and does not advance a checkpoint. Its default mode is read-only diagnosis.
