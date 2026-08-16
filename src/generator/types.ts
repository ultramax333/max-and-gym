import {ExercisePrescriptionRecord, ProgramDurationMinutes, ProgramFrequency} from '../programs/types';

export const GENERATOR_VERSION = 'deterministic-v7';
export const PROGRAM_SEED_VERSION = 'maxgym-seed-programs-v1';

export type GoalBlend = 'strength' | 'balanced' | 'hypertrophy' | 'endurance';
export type VariationLevel = 'low' | 'moderate' | 'high';
export type GeneratorRole = 'knee-dominant' | 'hinge' | 'horizontal-push' | 'vertical-push' | 'vertical-pull' | 'supported-pull' | 'posterior-assistance' | 'leg-assistance' | 'accessory';

export interface GeneratorCandidate {
    id: string;
    name: string;
    movementPattern: string;
    equipmentTags: string[];
    primaryMuscles: string[];
    secondaryMuscles: string[];
    generatorFocusZones?: string[];
    positionTags: string[];
    transitionTags: string[];
    impactTags: string[];
    setupTags: string[];
    defaultRestSeconds: number;
    defaultRepRange: {min: number; max: number};
    contentStatus: 'reviewed' | 'custom';
    generatorEligible: boolean;
    neverSuggest: boolean;
    archived: boolean;
    media: Array<{kind: string; path: string}>;
    favourite?: boolean;
    effectiveNeverSuggest?: boolean;
}

export interface StableExerciseInput {
    dayIndex: number;
    role: GeneratorRole;
    exerciseId: string;
    prescription: ExercisePrescriptionRecord;
    locked: boolean;
    stableUntil?: string;
}

export interface GeneratorInput {
    frequency: ProgramFrequency;
    durationMinutes: ProgramDurationMinutes;
    goal: GoalBlend;
    equipment: string[];
    priorityMuscles: string[];
    variation: VariationLevel;
    blockedExerciseIds: string[];
    blockedTags: string[];
    favouriteExerciseIds: string[];
    neverSuggestExerciseIds: string[];
    recentExerciseIds?: string[];
    stableExercises: StableExerciseInput[];
    coreMinutes: 10 | 15;
    lowBackComfortWarmup: boolean;
    sessionRestSeconds?: number;
    seed: string;
    generatorVersion: string;
    exerciseSeedVersion: string;
    programSeedVersion: string;
}

export interface NormalizedGeneratorInput extends GeneratorInput {
    inputHash: string;
}

export interface CandidateExclusion {exerciseId: string; role: GeneratorRole | 'core'; reasonCode: string; reason: string}
export interface CandidateSelection {exerciseId: string; role: GeneratorRole; score: number; reasons: string[]}

export interface GeneratedExercise {
    exerciseId: string;
    exerciseName: string;
    movementPattern: string;
    primaryMuscles: string[];
    role: GeneratorRole;
    prescription: ExercisePrescriptionRecord;
    locked: boolean;
    stableUntil?: string;
    alternativeExerciseIds: string[];
    score: number;
    reasons: string[];
}

export interface GeneratorDurationBreakdown {
    warmup: number;
    ramp: number;
    execution: number;
    rest: number;
    setup: number;
    transitions: number;
    conditioning: number;
    total: number;
    target: number;
}

export interface WarmupStep {id: string; name: string; seconds: number; reason: string}
export interface GeneratedConditioning {kind: 'low-impact'; name: string; seconds: number}
export interface GeneratedDay {
    name: string;
    emphasis: string;
    targetDurationMinutes: ProgramDurationMinutes;
    warmup: WarmupStep[];
    conditioning: GeneratedConditioning;
    exercises: GeneratedExercise[];
    duration: GeneratorDurationBreakdown;
    warnings: string[];
}

export interface GeneratorExplanation {
    normalizedInput: NormalizedGeneratorInput;
    selections: CandidateSelection[];
    exclusions: CandidateExclusion[];
    warnings: string[];
    weeklyPatterns: Record<string, number>;
    weeklyMuscles: Record<string, number>;
}

export interface GeneratedProgram {
    name: string;
    frequency: ProgramFrequency;
    durationMinutes: ProgramDurationMinutes;
    seed: string;
    generatorVersion: string;
    sessionRestSeconds?: number;
    identityHash: string;
    days: GeneratedDay[];
    explanation: GeneratorExplanation;
}

export type GenerationResult = {ok: true; program: GeneratedProgram} | {ok: false; code: 'INVALID_INPUT' | 'NO_VALID_CANDIDATE' | 'VALIDATION_FAILED'; message: string; exclusions: CandidateExclusion[]};

export interface GeneratedCoreSession {
    targetMinutes: 10 | 15;
    rounds: number;
    positionCluster: string;
    exercises: Array<{exerciseId: string; name: string; workSeconds: number; transitionSeconds: number}>;
    estimatedSeconds: number;
    exclusions: CandidateExclusion[];
}
