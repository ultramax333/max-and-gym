export interface LoadRecommendationHistory {
    sessionId: string;
    performedAt: string;
    suggestedLoadKg: number;
    sets: Array<{loadKg: number; reps: number; rir?: number; kind?: 'warmup' | 'working' | 'drop'}>;
}

export type LoadRecommendationConfidence = 'none' | 'low' | 'medium' | 'high';

export interface ExerciseLoadRecommendation {
    status: 'calibration' | 'recommended';
    confidence: LoadRecommendationConfidence;
    loadMinKg?: number;
    loadMaxKg?: number;
    suggestedLoadKg?: number;
    estimatedOneRepMaxKg?: number;
    evidenceSetCount: number;
    evidenceSessionCount: number;
    formula: 'epley-rir-v1';
    reason: string;
}

export interface ExerciseLoadRecommendationInput {
    repsMin: number;
    repsMax: number;
    targetRir: number;
    history: LoadRecommendationHistory[];
    incrementKg?: number;
}

interface EvidenceSet {
    sessionId: string;
    loadKg: number;
    reps: number;
    rir?: number;
    estimatedOneRepMaxKg: number;
}

const finite = (value: number): boolean => Number.isFinite(value);

function median(values: number[]): number {
    const ordered = [...values].sort((left, right) => left - right);
    const middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function roundToIncrement(value: number, incrementKg: number): number {
    const increment = finite(incrementKg) && incrementKg > 0 ? incrementKg : 0.5;
    return Math.round(value / increment) * increment;
}

function calibration(reason: string): ExerciseLoadRecommendation {
    return {
        status: 'calibration',
        confidence: 'none',
        evidenceSetCount: 0,
        evidenceSessionCount: 0,
        formula: 'epley-rir-v1',
        reason,
    };
}

export function recommendExerciseLoad(input: ExerciseLoadRecommendationInput): ExerciseLoadRecommendation {
    if (!Number.isInteger(input.repsMin) || !Number.isInteger(input.repsMax) || input.repsMin < 1 || input.repsMax < input.repsMin || !finite(input.targetRir) || input.targetRir < 0) {
        return calibration('The repetition or RIR target is invalid, so no load was estimated.');
    }

    const evidence = input.history
        .slice(0, 3)
        .flatMap((history): EvidenceSet[] => history.sets
            .filter((set) => (set.kind ?? 'working') === 'working')
            .filter((set) => finite(set.loadKg) && set.loadKg > 0 && Number.isInteger(set.reps) && set.reps >= 1 && set.reps <= 30)
            .map((set) => {
                const rir = set.rir === undefined || !finite(set.rir) ? undefined : Math.min(10, Math.max(0, set.rir));
                const repetitionsToFailure = set.reps + (rir ?? 0);
                return {
                    sessionId: history.sessionId,
                    loadKg: set.loadKg,
                    reps: set.reps,
                    ...(rir === undefined ? {} : {rir}),
                    estimatedOneRepMaxKg: set.loadKg * (1 + repetitionsToFailure / 30),
                };
            }));

    if (!evidence.length) return calibration('No suitable completed weighted set is available. Start conservatively and record repetitions plus RIR.');

    const estimatedOneRepMaxKg = median(evidence.map((set) => set.estimatedOneRepMaxKg));
    const loadFor = (repetitions: number) => estimatedOneRepMaxKg / (1 + (repetitions + input.targetRir) / 30);
    const incrementKg = input.incrementKg ?? 0.5;
    const loadMinKg = Math.max(0, roundToIncrement(loadFor(input.repsMax), incrementKg));
    const loadMaxKg = Math.max(loadMinKg, roundToIncrement(loadFor(input.repsMin), incrementKg));
    const latestLoadKg = input.history
        .flatMap((history) => history.sets.filter((set) => (set.kind ?? 'working') === 'working'))
        .find((set) => finite(set.loadKg) && set.loadKg > 0)?.loadKg;
    const suggestedLoadKg = latestLoadKg === undefined
        ? loadMinKg
        : Math.min(loadMaxKg, Math.max(loadMinKg, roundToIncrement(latestLoadKg, incrementKg)));
    const evidenceSessionCount = new Set(evidence.map((set) => set.sessionId)).size;
    const explicitRir = evidence.every((set) => set.rir !== undefined);
    const highRepetitionEvidence = evidence.some((set) => set.reps + (set.rir ?? 0) > 15);
    const confidence: LoadRecommendationConfidence = evidenceSessionCount >= 2 && evidence.length >= 4 && explicitRir && !highRepetitionEvidence
        ? 'high'
        : evidence.length >= 2 && explicitRir && !highRepetitionEvidence
            ? 'medium'
            : 'low';

    return {
        status: 'recommended',
        confidence,
        loadMinKg,
        loadMaxKg,
        suggestedLoadKg,
        estimatedOneRepMaxKg,
        evidenceSetCount: evidence.length,
        evidenceSessionCount,
        formula: 'epley-rir-v1',
        reason: highRepetitionEvidence
            ? 'Estimated from high-repetition history; use the range as a conservative starting point and adjust by RIR.'
            : explicitRir
                ? 'Estimated from completed working sets, repetitions and recorded RIR.'
                : 'Estimated without complete RIR history; confirm the load with a conservative working set.',
    };
}
