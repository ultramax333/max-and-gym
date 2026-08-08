export type ProgramStatus = 'draft' | 'active' | 'archived';
export type ProgramFrequency = 2 | 3;
export type ProgramDurationMinutes = 40 | 60;
export type ExerciseRole = 'primary' | 'secondary' | 'accessory' | 'conditioning';
export type ExerciseGroupType = 'single' | 'superset' | 'triset' | 'circuit';
export type ExerciseSetScheme = 'straight' | 'top-backoff' | 'ramp' | 'drop' | 'timed' | 'circuit';

export interface TrainingProgramRecord {
    id: string;
    name: string;
    description: string;
    source: 'manual' | 'legacy' | 'generator';
    status: ProgramStatus;
    weeklyFrequency: ProgramFrequency;
    defaultDurationMinutes: ProgramDurationMinutes;
    currentDayIndex: number;
    createdAt: string;
    updatedAt: string;
    archivedAt?: string;
    generatorVersion?: string;
    generatorSeed?: string;
    generatorInputSnapshot?: string;
    generatorExplanationSnapshot?: string;
    generatorProgramSnapshot?: string;
}

export interface ProgramDayRecord {
    id: string;
    programId: string;
    name: string;
    sequenceIndex: number;
    emphasis: string;
    targetDurationMinutes: ProgramDurationMinutes;
    warmupSeconds: number;
    conditioningSeconds: number;
    notes: string;
}

export interface ProgramExerciseRecord {
    id: string;
    programDayId: string;
    exerciseId: string;
    exerciseNameSnapshot: string;
    movementPatternSnapshot: string;
    primaryMusclesSnapshot: string[];
    sequenceIndex: number;
    role: ExerciseRole;
    generatorRoleSnapshot?: string;
    groupId?: string;
    groupType: ExerciseGroupType;
    groupSequenceIndex: number;
    locked: boolean;
    stableUntil?: string;
    alternativeExerciseIds: string[];
    prescriptionId: string;
    progressionRuleId: string;
    notes: string;
}

export interface ExercisePrescriptionRecord {
    id: string;
    workingSets: number;
    repsMin: number;
    repsMax: number;
    targetRir: number;
    restSeconds: number;
    tempo?: string;
    loadReferenceKg: number;
    setScheme?: ExerciseSetScheme;
    warmupSets?: number;
    dropSets?: number;
}

export interface ProgressionRuleRecord {
    id: string;
    kind: 'double-progression' | 'fixed-increment' | 'top-set-back-off' | 'conditioning-time' | 'manual-hold' | 'deload-review' | 'load-after-success' | 'manual';
    description: string;
    requiresApproval: true;
}

export interface ProgramExerciseDetail extends ProgramExerciseRecord {
    prescription: ExercisePrescriptionRecord;
    progressionRule: ProgressionRuleRecord;
}

export interface ProgramDayDetail extends ProgramDayRecord {
    exercises: ProgramExerciseDetail[];
}

export interface ProgramDetail extends TrainingProgramRecord {
    days: ProgramDayDetail[];
}

export interface CreateProgramInput {
    name: string;
    weeklyFrequency: ProgramFrequency;
    defaultDurationMinutes: ProgramDurationMinutes;
}

export interface AddProgramExerciseInput {
    dayId: string;
    exerciseId: string;
    exerciseName: string;
    movementPattern: string;
    primaryMuscles: string[];
    defaultRestSeconds: number;
    defaultReps: {min: number; max: number};
}
