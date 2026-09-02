# Data model

This is the authoritative conceptual model. Codex may adapt TypeScript names to existing RepQuest entities only after documenting the mapping.

## 1. Conventions

- User-created records use universally unique identifiers.
- Immutable seed records use namespaced stable string identifiers.
- All dates use one documented UTC representation internally and are displayed in local time.
- Internal units: kilograms, centimetres, seconds, metres.
- Optional values are `null`/undefined, never sentinel values such as `-1`.
- All critical user records include `createdAt` and `updatedAt`.
- Historical sessions store snapshots of names and prescriptions needed for future display.
- User media is stored as Blob objects in IndexedDB.
- Every schema, seed, export, generator, and cache change has an independent version.
- Critical operations carry `operationId` for idempotency.

## 2. AppSettings

- `id`: singleton
- `locale`: `en`
- `theme`: `dark`
- `weightUnit`: `kg`
- `lengthUnit`: `cm`
- `weekStartsOn`
- `defaultEffortMetric`: `rir | rpe | none`
- `timerSoundEnabled`
- `vibrationEnabled`
- `wakeLockEnabled`
- `defaultRestAdjustments`: list of seconds
- `variationPreference`: `low | balanced | high`
- `backupReminderDays`
- `blurPhotoThumbnails`
- `persistentStorageRequestedAt`
- `onboardingCompletedAt`
- `createdAt`
- `updatedAt`

## 3. UserTrainingProfile

- `id`
- `experienceLevel`: `advanced`
- `weeklyFrequency`: `2 | 3`
- `defaultMainDurationMinutes`: `40 | 60`
- `defaultCoreDurationMinutes`: `10 | 15`
- `goalWeights`: normalized strength, hypertrophy, conditioning
- `availableEquipmentTags`
- `priorityMuscleTags`
- `variationPreference`
- `lowBackComfortWarmupEnabled`
- `createdAt`
- `updatedAt`

No free-form health note is required in the profile.

## 4. MovementConstraint

- `id`
- `kind`: `exercise | movement-tag | transition-tag | impact-tag | equipment`
- `target`
- `severity`: `blocked | caution`
- `source`: `system-default | user`
- `active`
- `safeLabel`
- `createdAt`
- `updatedAt`

System-default blocked targets:

- `bunny-jump`
- `burpee-like`
- `plank-to-stand`
- `rapid-floor-to-standing`
- `high-impact-ground-transition`

## 5. EquipmentProfile

- `id`
- `name`
- `equipmentTags`
- `isDefault`
- `createdAt`
- `updatedAt`

## 6. Exercise

- `id`
- `source`: `free-exercise-db | maxgym-seed | user`
- `sourceId`
- `sourceRevision`
- `name`
- `aliases`
- `category`: `strength | conditioning | mobility | core`
- `movementPattern`
- `force`: `push | pull | static | mixed`
- `mechanic`: `compound | isolation | isometric | cyclical`
- `level`
- `equipmentTags`
- `primaryMuscles`
- `secondaryMuscles`
- `positionTags`
- `transitionTags`
- `impactTags`
- `setupTags`
- `metricType`: `weight-reps | bodyweight-reps | bodyweight-plus-load | assisted-reps | reps-only | duration | distance`
- `unilateral`
- `setupInstructions`
- `executionSteps`
- `breathingCue`
- `formCues`
- `commonMistakes`
- `rangeOfMotionNote`
- `generalCautions`
- `defaultRestSeconds`
- `defaultRepRange`
- `defaultRirRange`
- `contentStatus`: `imported | reviewed | custom`
- `generatorEligible`
- `favourite`
- `neverSuggest`
- `archived`
- `sourceName`
- `sourceUrl`
- `license`
- `userNotes`
- `createdAt`
- `updatedAt`

Generator eligibility requires reviewed/custom status, valid tags, and no active hard block.

## 7. ExerciseMedia

- `id`
- `exerciseId`
- `kind`: `start-image | end-image | thumbnail | custom-image`
- `storage`: `bundled-path | indexeddb-blob`
- `path`, for bundled assets
- `blobId`, for local media
- `mimeType`
- `width`
- `height`
- `byteSize`
- `checksum`
- `altText`
- `sourceName`
- `sourceUrl`
- `license`
- `createdAt`

No exercise-video entity is required in version 1.

## 8. Program

- `id`
- `name`
- `description`
- `source`: `seed | generated | user`
- `status`: `draft | active | archived`
- `weeklyFrequency`: `2 | 3`
- `blockLengthWeeks`
- `currentWeek`
- `goalWeights`
- `defaultDurationMinutes`
- `generatorVersion`
- `generatorSeed`
- `generationInputSnapshot`
- `generationExplanationId`
- `createdAt`
- `updatedAt`
- `archivedAt`

## 9. ProgramDay

- `id`
- `programId`
- `name`
- `sequenceIndex`
- `emphasisTags`
- `durationTargetMinutes`
- `estimatedDurationSeconds`
- `warmupBlockId`
- `conditioningBlockId`
- `notes`
- `createdAt`
- `updatedAt`

## 10. ProgramExercise

- `id`
- `programDayId`
- `exerciseId`
- `sequenceIndex`
- `role`: `primary | secondary | accessory | core | conditioning | mobility`
- `groupId`
- `groupType`: `single | superset | triset | circuit`
- `groupSequenceIndex`
- `locked`
- `stableUntil`
- `alternativeExerciseIds`
- `prescriptionId`
- `progressionRuleId`
- `notes`
- `createdAt`
- `updatedAt`

## 11. ExercisePrescription

- `id`
- `setScheme`: `straight | top-backoff | ramp | drop | timed | circuit`
- `workingSetCount`
- `warmupSetRules`
- `repRangeMin`
- `repRangeMax`
- `durationSeconds`
- `distanceMetres`
- `targetLoadKg`
- `loadReference`: `manual | previous | percentage-estimated-max | bodyweight | assisted`
- `targetRirMin`
- `targetRirMax`
- `targetRpe`
- `restSeconds`
- `tempo`
- `createdAt`
- `updatedAt`

## 12. ProgressionRule

- `id`
- `type`: `double-progression | fixed-increment | top-set-backoff | time-progression | manual`
- `minimumIncrementKg`
- `successConditions`
- `holdConditions`
- `regressionConditions`
- `deloadBehaviour`
- `confirmationRequired`: always true
- `createdAt`
- `updatedAt`

## 13. WorkoutSession

- `id`
- `operationId`, for creation/finish
- `programId`, optional
- `programDayId`, optional
- `nameSnapshot`
- `prescriptionSnapshot`
- `status`: `planned | active | paused | completed | abandoned`
- `startedAt`
- `endedAt`
- `elapsedSeconds`
- `pausedDurationSeconds`
- `durationTargetMinutes`
- `currentSessionExerciseId`
- `currentSetId`
- `warmupCompleted`
- `conditioningCompleted`
- `sessionRpe`
- `discomfortBefore`
- `discomfortAfter`
- `notes`
- `appVersion`
- `createdAt`
- `updatedAt`

Invariant: at most one active/paused workout exists.

## 14. SessionExercise

- `id`
- `sessionId`
- `sourceProgramExerciseId`, optional
- `exerciseId`
- `originalExerciseId`, optional
- `exerciseSnapshot`
- `prescriptionSnapshot`
- `sequenceIndex`
- `groupId`
- `status`: `pending | active | completed | skipped | substituted`
- `substitutionReason`
- `skipReason`
- `machineSetupNote`
- `notes`
- `startedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

## 15. PerformedSet

- `id`
- `operationId`
- `sessionExerciseId`
- `sequenceIndex`
- `setType`: `warmup | working | top | backoff | drop | amrap | failure | timed | distance | bodyweight | assisted`
- `status`: `planned | completed | skipped | undone`
- `targetRepsMin`
- `targetRepsMax`
- `actualReps`
- `targetLoadKg`
- `actualLoadKg`
- `targetDurationSeconds`
- `actualDurationSeconds`
- `targetDistanceMetres`
- `actualDistanceMetres`
- `targetRir`
- `actualRir`
- `targetRpe`
- `actualRpe`
- `tempo`
- `discomfort`
- `completedAt`
- `personalRecordFlags`
- `note`
- `createdAt`
- `updatedAt`

Unique index/guard on `operationId` prevents duplicate completion.

## 16. RestTimerState

- `id`
- `sessionId`
- `performedSetId`
- `type`
- `startedAt`
- `endsAt`
- `pausedAt`
- `remainingWhenPausedSeconds`
- `status`: `running | paused | completed | cancelled`
- `signalDeliveredAt`
- `createdAt`
- `updatedAt`

Invariant: active timer belongs to the active workout.

## 17. DiscomfortEntry

- `id`
- `sessionId`
- `exerciseId`, optional
- `timing`: `before | during | after`
- `bodyArea`, optional
- `intensity`: optional zero-to-ten user value
- `safeNote`, optional user text
- `actionTaken`: `continued | reduced-load | substituted | stopped`
- `createdAt`

The app does not diagnose this entry.

## 18. BodyMeasurement

- `id`
- `recordedAt`
- `type`: `weight | waist | chest | hips | upper-arm | thigh | custom`
- `customLabel`, when needed
- `value`
- `unit`
- `note`
- `createdAt`
- `updatedAt`

## 19. MediaBlob

- `id`
- `purpose`: `progress-photo | progress-thumbnail | custom-exercise-image`
- `blob`
- `mimeType`
- `width`
- `height`
- `byteSize`
- `checksum`
- `createdAt`

## 20. ProgressPhoto

- `id`
- `recordedAt`
- `pose`: `front | side-left | side-right | back | custom`
- `imageBlobId`
- `thumbnailBlobId`
- `weightKg`, optional
- `note`
- `blurThumbnail`
- `originalByteSize`
- `storedByteSize`
- `createdAt`
- `updatedAt`

## 21. ProgressionProposal

- `id`
- `operationId`, used on resolution
- `exerciseId`
- `programId`
- `basedOnSessionIds`
- `type`: `increase-load | increase-reps | add-set | hold | reduce-load | reduce-volume | deload | rotate-accessory`
- `currentPrescriptionSnapshot`
- `proposedPrescriptionSnapshot`
- `reasonCode`
- `humanReadableReason`
- `status`: `pending | accepted | rejected | postponed | expired`
- `createdAt`
- `resolvedAt`

## 22. PersonalRecord

- `id`
- `exerciseId`
- `sessionId`
- `performedSetId`
- `type`
- `value`
- `achievedAt`
- `createdAt`

Records are recomputable; keep enough source linkage to audit them.

## 23. GeneratorExplanation

- `id`
- `programId`
- `generatorVersion`
- `seed`
- `inputSnapshot`
- `candidateScores`
- `excludedCandidatesWithReasons`
- `selectedExercisesWithReasons`
- `durationBreakdown`
- `weeklyBalance`
- `warnings`
- `createdAt`

No personal notes are included in explanations.

## 24. DiagnosticEvent

- `id`
- `timestamp`
- `level`: `info | warning | error`
- `subsystem`
- `code`
- `safeMessage`
- `buildId`
- `databaseSchemaVersion`
- `route`
- `operationId`, optional
- `entityHash`, optional
- `safeContext`, allow-listed key/value object
- `resolvedAt`, optional

Retention: maximum 1000 events and 30 days.

## 25. OperationJournal

- `operationId`
- `type`
- `status`: `started | committed | failed | rolled-back`
- `startedAt`
- `finishedAt`
- `buildId`
- `safeErrorCode`, optional

Use for migrations, imports, critical multi-record operations, and recovery.

## 26. MigrationJournal

- `id`
- `fromVersion`
- `toVersion`
- `operationId`
- `status`
- `startedAt`
- `completedAt`
- `recordCountSummary`
- `safeErrorCode`
- `buildId`

## 27. IntegrityCheckRun

- `id`
- `startedAt`
- `completedAt`
- `scope`
- `status`
- `checkResults`
- `buildId`
- `databaseSchemaVersion`

Store only safe counts/status, not personal values.

## 28. AppMeta

Singleton or key/value records:

- application version;
- build identifier;
- Git commit;
- database schema version;
- export format version;
- exercise seed version;
- program seed version;
- generator version;
- cache version;
- last successful migration;
- last successful integrity check;
- last backup timestamp;
- local installation identifier.

The local installation identifier is never transmitted automatically.

## 29. BackupManifest

- product;
- application version;
- export format version;
- database schema version;
- exercise/program seed versions;
- exportedAt;
- record counts;
- media count and total bytes;
- file checksums;
- warnings;
- source installation identifier, optional.

## 30. DiagnosticManifest

- product;
- application/build/Git identity;
- database/export/seed/generator/cache versions;
- exportedAt;
- browser capability summary;
- service-worker state;
- storage estimate;
- self-test summary;
- diagnostic event count;
- explicit list of excluded sensitive categories.

## 31. Required indexes and invariants

At minimum:

- sessions by status and date;
- session exercises by session/order;
- sets by session exercise/order;
- sets unique by operation identifier;
- exercises by content status, movement, equipment, favourite, never-suggest;
- programs by status;
- measurements by type/date;
- photos by pose/date;
- diagnostic events by timestamp/code/subsystem;
- operation journal by operation/status.

Required invariants:

- at most one active workout;
- no completed set without a valid session exercise;
- no active timer without valid active workout ownership;
- no photo metadata without image and thumbnail blobs;
- no generated program containing a hard-blocked exercise/tag;
- no historical session depends on mutable live program text.

Contextual exercise ratings are stored in the existing `appMeta` backup surface under a versioned key. Their compound logical identity is body area + training goal + exercise ID. Workout and saved-program snapshots may carry optional training-context and equipment-tag fields; these are additive non-indexed fields and require no schema migration. Session exercises can also carry an optional `equipmentStationSnapshot` chosen during pre-start equipment ordering. It changes neither availability tags nor the saved program, and is cleared when substituting an exercise.

## 32. Migration requirements

- Sequential, explicit, tested.
- No remote fetch.
- No database deletion shortcut.
- Failure leaves recoverable data.
- Seed updates are separate from user-schema migrations.
- Major transitions prompt for backup when the app can still open safely.
- Prior production fixtures are maintained until the corresponding migration is deliberately retired.
