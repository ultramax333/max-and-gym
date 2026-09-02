export type WorkoutSessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type PerformedSetStatus = 'planned' | 'completed' | 'undone';
export type RestTimerStatus = 'running' | 'paused' | 'completed' | 'cancelled';
export type WorkoutSetKind = 'warmup' | 'working' | 'drop';

export interface WorkoutSessionRecord {
    id: string;
    creationOperationId: string;
    finishOperationId?: string;
    nameSnapshot: string;
    programId?: string;
    programDayId?: string;
    status: WorkoutSessionStatus;
    startedAt: string;
    endedAt?: string;
    pausedAt?: string;
    pausedDurationSeconds: number;
    elapsedSeconds?: number;
    plannedDurationSeconds?: number;
    restOverrideSeconds?: number;
    trainingContext?: {zone: string; goal: string};
    currentSessionExerciseId: string;
    currentSetId: string;
    createdAt: string;
    updatedAt: string;
}

export interface StartWorkoutInput {
    name: string;
    plannedDurationSeconds?: number;
    restOverrideSeconds?: number;
    trainingContext?: {zone: string; goal: string};
    programId?: string;
    programDayId?: string;
    exercises: Array<{
        exerciseId: string;
        exerciseName: string;
        prescriptionSnapshot: string;
        programExerciseId?: string;
        workingSets: number;
        repsMin: number;
        repsMax: number;
        targetLoadKg: number;
        targetRir: number;
        restSeconds: number;
        locked?: boolean;
        alternativeExerciseIds?: string[];
        equipmentTags?: string[];
        equipmentStation?: import('./equipmentStations').EquipmentStation;
        groupId?: string;
        groupType?: 'single' | 'superset' | 'triset' | 'circuit';
        groupSequenceIndex?: number;
        setScheme?: 'straight' | 'top-backoff' | 'ramp' | 'drop' | 'timed' | 'circuit';
        warmupSets?: number;
        dropSets?: number;
    }>;
}

export interface SessionExerciseRecord {
    id: string;
    sessionId: string;
    exerciseId: string;
    exerciseNameSnapshot: string;
    originalExerciseIdSnapshot?: string;
    originalExerciseNameSnapshot?: string;
    substitutionReason?: 'equipment-unavailable' | 'user-choice';
    prescriptionSnapshot: string;
    programExerciseId?: string;
    lockedSnapshot: boolean;
    alternativeExerciseIdsSnapshot: string[];
    equipmentTagsSnapshot?: string[];
    equipmentStationSnapshot?: import('./equipmentStations').EquipmentStation;
    groupIdSnapshot?: string;
    groupTypeSnapshot?: 'single' | 'superset' | 'triset' | 'circuit';
    groupSequenceIndexSnapshot?: number;
    setSchemeSnapshot?: 'straight' | 'top-backoff' | 'ramp' | 'drop' | 'timed' | 'circuit';
    sequenceIndex: number;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    createdAt: string;
    updatedAt: string;
}

export interface PerformedSetRecord {
    id: string;
    sessionId: string;
    sessionExerciseId: string;
    sequenceIndex: number;
    setKind?: WorkoutSetKind;
    status: PerformedSetStatus;
    targetRepsMin: number;
    targetRepsMax: number;
    actualReps?: number;
    targetLoadKg: number;
    actualLoadKg?: number;
    targetRir: number;
    actualRir?: number;
    restSeconds: number;
    completionOperationId?: string;
    undoOperationId?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface RestTimerRecord {
    id: string;
    sessionId: string;
    performedSetId: string;
    startedAt: string;
    endsAt: string;
    pausedAt?: string;
    remainingWhenPausedSeconds?: number;
    status: RestTimerStatus;
    signalDeliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutOperationRecord {
    operationId: string;
    kind: 'start' | 'complete-set' | 'undo-set' | 'replace-exercise' | 'adjust-sets' | 'finish' | 'abandon';
    status: 'started' | 'committed' | 'failed';
    sessionId?: string;
    entityId?: string;
    startedAt: string;
    finishedAt?: string;
    safeErrorCode?: string;
}

export interface ActiveWorkoutSnapshot {
    session: WorkoutSessionRecord;
    exercises: SessionExerciseRecord[];
    sets: PerformedSetRecord[];
    timer?: RestTimerRecord;
}

export interface CompleteSetInput {
    sessionId: string;
    setId: string;
    operationId: string;
    actualLoadKg: number;
    actualReps: number;
    actualRir?: number;
}

export interface ReplaceSessionExerciseInput {
    sessionId: string;
    sessionExerciseId: string;
    operationId: string;
    replacementExerciseId: string;
    replacementExerciseName: string;
    replacementEquipmentTags?: string[];
    alternativeExerciseIds?: string[];
    reason: 'equipment-unavailable' | 'user-choice';
}

export interface AdjustWorkingSetsInput {
    sessionId: string;
    currentSessionExerciseId: string;
    operationId: string;
}

export interface WorkoutSetAdjustmentResult {
    snapshot: ActiveWorkoutSnapshot;
    addedExerciseName: string;
    reducedExerciseName: string;
}

export interface ExercisePerformanceSummary {
    sessionId: string;
    sessionName: string;
    performedAt: string;
    suggestedLoadKg: number;
    sets: Array<{loadKg: number; reps: number; rir?: number; kind?: WorkoutSetKind}>;
}
