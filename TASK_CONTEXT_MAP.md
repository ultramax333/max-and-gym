# Task context map

To avoid instruction overload, Codex loads:

1. `EXECUTION_CORE.md`;
2. `AGENTS.md`;
3. `PROJECT_CONTRACT.json`;
4. the current `CODEX_TASKS/<task>.md`;
5. only the task-specific references below.

Task 00 is the only task that must read every specification once to validate consistency.

## Task 00

Read all `docs/spec/`, all ADRs, templates, source/licence files.

## Task 01

- `ARCHITECTURE.md`
- `DIAGNOSTICS_AND_AUDIT.md`
- `AUDIT_AUTOMATION_CONTRACT.md`
- `DATABASE_MIGRATION_PROTOCOL.md`
- `PWA_UPDATE_STATE_MACHINE.md`
- `KNOWN_FAILURE_MODES.md`
- `QUALITY_STRATEGY.md`
- `DEPLOYMENT.md`
- `LICENSE_AND_SOURCES.md`
- ADR 0004, 0005, 0006, 0007.

## Task 02

- `DECISIONS.md`
- `SCREEN_BLUEPRINTS.md`
- `COPY_DECK.md`
- `DESIGN_SYSTEM.md`
- `COMPONENT_CATALOG.md`
- `UI_ADOPTION_STRATEGY.md`
- `PRELIMINARY_UI_DONOR_MAP.md`
- `USER_FLOWS.md`
- ADR 0002, 0003.

## Task 03

- `WORKOUT_STATE_MACHINE.md`
- `DATA_MODEL.md`
- `SCREEN_BLUEPRINTS.md`
- `COPY_DECK.md`
- `DIAGNOSTICS_AND_AUDIT.md`
- `KNOWN_FAILURE_MODES.md`
- `QUALITY_STRATEGY.md`
- `ACCEPTANCE_TESTS.md`
- ADR 0006, 0007, 0008.

## Task 04

- `EXERCISE_DATA.md`
- `DATA_MODEL.md`
- `SAFETY_AND_PRIVACY.md`
- `LICENSE_AND_SOURCES.md`
- `DESIGN_SYSTEM.md`
- `ACCEPTANCE_TESTS.md`
- ADR 0009.

## Task 05

- `DATA_MODEL.md`
- `SCREEN_BLUEPRINTS.md`
- `TRAINING_ENGINE.md`
- `WORKOUT_STATE_MACHINE.md`
- `QUALITY_STRATEGY.md`
- `ACCEPTANCE_TESTS.md`.

## Task 06

- `TRAINING_ENGINE.md`
- `GENERATOR_ALGORITHM.md`
- `SEED_PROGRAMS.md`
- `SAFETY_AND_PRIVACY.md`
- `DATA_MODEL.md`
- `ACCEPTANCE_TESTS.md`.

## Task 07

- `DATA_MODEL.md`
- `BACKUP_IMPORT_STATE_MACHINE.md`
- `SAFETY_AND_PRIVACY.md`
- `DIAGNOSTICS_AND_AUDIT.md`
- `DEBUG_PLAYBOOK.md`
- `QUALITY_STRATEGY.md`
- `ACCEPTANCE_TESTS.md`
- ADR 0010.

## Task 08

- `CHECKPOINTS.md`
- `ACCEPTANCE_TESTS.md`
- `RISK_REGISTER.md`
- `DEPLOYMENT.md`
- `RELEASE_PROCESS.md`
- `KNOWN_FAILURE_MODES.md`
- `LICENSE_AND_SOURCES.md`
- `HOW_TO_AUDIT_WITH_CHATGPT_FR.md`.

All file names above are under `docs/spec/` unless stated otherwise.

## Task 90 — diagnostic audit

Read:

- `PROJECT_STATUS.md`;
- `DIAGNOSTICS_AND_AUDIT.md`;
- `AUDIT_AUTOMATION_CONTRACT.md`;
- `DEBUG_PLAYBOOK.md`;
- `KNOWN_FAILURE_MODES.md`;
- `DATABASE_MIGRATION_PROTOCOL.md` when data is involved;
- the relevant state machine;
- the latest accepted checkpoint report;
- the supplied redacted bug evidence.

Task 90 is outside the normal CP0–CP8 sequence. It is read-only by default and may implement a correction only with explicit `MODE=FIX`.
