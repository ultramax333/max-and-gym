import {PerformedSetRecord, SessionExerciseRecord, WorkoutSessionRecord} from '../workout/types';

export interface RawProgressSet {
    setId: string;
    sessionId: string;
    performedAt: string;
    loadKg: number;
    reps: number;
    volumeKg: number;
    estimatedOneRepMaxKg: number;
}

export interface ExerciseRecords {
    maxLoadKg: number;
    maxReps: number;
    maxVolumeSetKg: number;
    estimatedOneRepMaxKg: number;
}

export interface ExerciseProgress {
    rawSets: RawProgressSet[];
    records: ExerciseRecords;
    estimatedMaxTrend: Array<{recordedAt: string; valueKg: number}>;
    textSummary: string;
}

export interface ProgressOverview {
    completedSessions: number;
    totalSets: number;
    totalVolumeKg: number;
    totalDurationSeconds: number;
    weeklyFrequency: Array<{period: string; sessions: number}>;
    monthlyFrequency: Array<{period: string; sessions: number}>;
    movementDistribution: Record<string, number>;
    muscleDistribution: Record<string, number>;
    textSummary: string;
}

export const estimatedOneRepMax = (loadKg: number, reps: number): number => reps <= 0 || loadKg <= 0 ? 0 : Math.round(loadKg * (1 + Math.min(reps, 30) / 30) * 10) / 10;

function periodWeek(iso: string): string {
    const date = new Date(iso);
    const day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day);
    return date.toISOString().slice(0, 10);
}

function frequency(sessions: WorkoutSessionRecord[], period: (iso: string) => string): Array<{period: string; sessions: number}> {
    const counts = new Map<string, number>();
    for (const session of sessions) counts.set(period(session.endedAt ?? session.startedAt), (counts.get(period(session.endedAt ?? session.startedAt)) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({period: key, sessions: value}));
}

export function calculateExerciseProgress(exerciseId: string, sessions: WorkoutSessionRecord[], exercises: SessionExerciseRecord[], sets: PerformedSetRecord[]): ExerciseProgress {
    const completedSessions = new Map(sessions.filter((entry) => entry.status === 'completed').map((entry) => [entry.id, entry]));
    const exerciseRows = new Set(exercises.filter((entry) => entry.exerciseId === exerciseId && completedSessions.has(entry.sessionId)).map((entry) => entry.id));
    const rawSets = sets.filter((entry) => exerciseRows.has(entry.sessionExerciseId) && entry.status === 'completed').map((entry): RawProgressSet => {
        const session = completedSessions.get(entry.sessionId)!;
        const loadKg = entry.actualLoadKg ?? entry.targetLoadKg;
        const reps = entry.actualReps ?? 0;
        return {setId: entry.id, sessionId: entry.sessionId, performedAt: entry.completedAt ?? session.endedAt ?? session.startedAt, loadKg, reps, volumeKg: loadKg * reps, estimatedOneRepMaxKg: estimatedOneRepMax(loadKg, reps)};
    }).sort((a, b) => a.performedAt.localeCompare(b.performedAt) || a.setId.localeCompare(b.setId));
    const records: ExerciseRecords = {
        maxLoadKg: Math.max(0, ...rawSets.map((entry) => entry.loadKg)),
        maxReps: Math.max(0, ...rawSets.map((entry) => entry.reps)),
        maxVolumeSetKg: Math.max(0, ...rawSets.map((entry) => entry.volumeKg)),
        estimatedOneRepMaxKg: Math.max(0, ...rawSets.map((entry) => entry.estimatedOneRepMaxKg)),
    };
    const byDate = new Map<string, number>();
    for (const entry of rawSets) byDate.set(entry.performedAt.slice(0, 10), Math.max(byDate.get(entry.performedAt.slice(0, 10)) ?? 0, entry.estimatedOneRepMaxKg));
    const estimatedMaxTrend = [...byDate].map(([recordedAt, valueKg]) => ({recordedAt, valueKg}));
    const textSummary = rawSets.length ? `${rawSets.length} séries terminées. Meilleure charge ${records.maxLoadKg} kg ; maximum estimé ${records.estimatedOneRepMaxKg} kg.` : 'Aucune série terminée pour cet exercice.';
    return {rawSets, records, estimatedMaxTrend, textSummary};
}

export function calculateProgressOverview(sessions: WorkoutSessionRecord[], exercises: SessionExerciseRecord[], sets: PerformedSetRecord[], taxonomy: Record<string, {movement?: string; muscles?: string[]}> = {}): ProgressOverview {
    const completed = sessions.filter((entry) => entry.status === 'completed').sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    const sessionIds = new Set(completed.map((entry) => entry.id));
    const completedSets = sets.filter((entry) => sessionIds.has(entry.sessionId) && entry.status === 'completed');
    const exerciseById = new Map(exercises.map((entry) => [entry.id, entry]));
    const movementDistribution: Record<string, number> = {};
    const muscleDistribution: Record<string, number> = {};
    for (const set of completedSets) {
        const exercise = exerciseById.get(set.sessionExerciseId);
        const tags = exercise ? taxonomy[exercise.exerciseId] : undefined;
        const movement = tags?.movement ?? 'non classé';
        movementDistribution[movement] = (movementDistribution[movement] ?? 0) + 1;
        for (const muscle of tags?.muscles ?? []) muscleDistribution[muscle] = (muscleDistribution[muscle] ?? 0) + 1;
    }
    const totalVolumeKg = completedSets.reduce((total, entry) => total + (entry.actualLoadKg ?? entry.targetLoadKg) * (entry.actualReps ?? 0), 0);
    const totalDurationSeconds = completed.reduce((total, entry) => total + (entry.elapsedSeconds ?? 0), 0);
    return {
        completedSessions: completed.length,
        totalSets: completedSets.length,
        totalVolumeKg,
        totalDurationSeconds,
        weeklyFrequency: frequency(completed, periodWeek),
        monthlyFrequency: frequency(completed, (iso) => iso.slice(0, 7)),
        movementDistribution,
        muscleDistribution,
        textSummary: completed.length ? `${completed.length} séances terminées, ${completedSets.length} séries et ${Math.round(totalDurationSeconds / 60)} minutes enregistrées.` : 'Aucune séance terminée pour calculer une tendance.',
    };
}
