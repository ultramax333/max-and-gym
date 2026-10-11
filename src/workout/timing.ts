import {ActiveWorkoutSnapshot, PerformedSetRecord, RestTimerRecord} from './types';

export interface ExerciseTimingProfile {
    exerciseId: string;
    multiplier: number;
    sampleCount: number;
    meanSecondsPerSet: number;
}

export function defaultSetSeconds(reps: number): number {
    return Math.min(85, Math.max(30, Math.round(10 + reps * 3)));
}

export function estimatedSetSeconds(exerciseId: string, reps: number, profiles: ExerciseTimingProfile[] = []): number {
    const profile = profiles.find(entry => entry.exerciseId === exerciseId && entry.sampleCount >= 3);
    const multiplier = profile && Number.isFinite(profile.multiplier) ? Math.min(4, Math.max(0.6, profile.multiplier)) : 1;
    return Math.round(defaultSetSeconds(reps) * multiplier);
}

function activeCompletion(set: PerformedSetRecord, snapshot: ActiveWorkoutSnapshot): number | undefined {
    if (set.activeElapsedAtCompletionSeconds !== undefined) return set.activeElapsedAtCompletionSeconds;
    if (snapshot.session.pausedDurationSeconds || !set.completedAt) return undefined;
    return (Date.parse(set.completedAt) - Date.parse(snapshot.session.startedAt)) / 1000;
}

/** Consecutive sets of the same exercise avoid attributing setup or station changes to work. */
export function learnExerciseTiming(history: Array<ActiveWorkoutSnapshot & {timers: RestTimerRecord[]}>, goal?: string): ExerciseTimingProfile[] {
    const observations = new Map<string, Array<{seconds: number; ratio: number}>>();
    for (const snapshot of history) {
        if (snapshot.session.status !== 'completed' || (goal && snapshot.session.trainingContext?.goal !== goal)) continue;
        const sets = snapshot.sets.filter(set => set.status === 'completed' && set.completedAt)
            .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!) || a.sequenceIndex - b.sequenceIndex);
        for (let index = 1; index < sets.length; index++) {
            const previous = sets[index - 1], current = sets[index];
            const exercise = snapshot.exercises.find(entry => entry.id === current.sessionExerciseId);
            if (!exercise || exercise.groupIdSnapshot || current.sessionExerciseId !== previous.sessionExerciseId
                || current.sequenceIndex !== previous.sequenceIndex + 1 || current.undoOperationId || previous.undoOperationId
                || (current.setKind ?? 'working') !== 'working' || (previous.setKind ?? 'working') !== 'working') continue;
            const before = activeCompletion(previous, snapshot), after = activeCompletion(current, snapshot);
            if (before === undefined || after === undefined || !Number.isFinite(before) || !Number.isFinite(after)) continue;
            const interval = after - before;
            const timer = snapshot.timers.find(entry => entry.performedSetId === previous.id);
            // Old records without a timer cannot reliably separate work from recovery.
            if (!timer && previous.restSeconds > 0) continue;
            const configuredRest = timer?.durationSeconds ?? (timer ? (Date.parse(timer.endsAt) - Date.parse(timer.startedAt)) / 1000 : 0);
            const stopped = timer?.activeElapsedAtStopSeconds;
            const rest = Math.max(0, Math.min(interval, configuredRest,
                stopped !== undefined ? stopped - (timer?.activeElapsedAtStartSeconds ?? before)
                    : timer?.status === 'cancelled' && !snapshot.session.pausedDurationSeconds
                        ? (Date.parse(timer.updatedAt) - Date.parse(timer.startedAt)) / 1000 : interval));
            const seconds = interval - rest;
            const reps = current.actualReps;
            if (!Number.isInteger(reps) || !reps || seconds < 15 || seconds > 300 || interval > 900) continue;
            const values = observations.get(exercise.exerciseId) ?? [];
            values.push({seconds, ratio: seconds / defaultSetSeconds(reps)});
            observations.set(exercise.exerciseId, values);
        }
    }
    return [...observations.entries()].flatMap(([exerciseId, all]) => {
        const recent = all.slice(0, 30);
        if (recent.length < 3) return [];
        const sorted = [...recent].sort((a, b) => a.ratio - b.ratio);
        const trim = sorted.length >= 6 ? Math.floor(sorted.length * 0.15) : 0;
        const samples = sorted.slice(trim, sorted.length - trim);
        const average = samples.reduce((sum, sample) => sum + sample.ratio, 0) / samples.length;
        // Gradual learning prevents one unusual session dominating the estimate.
        const confidence = Math.min(1, recent.length / 8);
        return [{exerciseId, multiplier: Math.round(Math.min(4, Math.max(0.6, 1 + (average - 1) * confidence)) * 100) / 100,
            sampleCount: recent.length, meanSecondsPerSet: Math.round(samples.reduce((sum, sample) => sum + sample.seconds, 0) / samples.length)}];
    }).sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
}

export function remainingPlanSeconds(snapshot: ActiveWorkoutSnapshot, profiles: ExerciseTimingProfile[] = [], currentRestSeconds = 0, activeElapsedSeconds?: number): number {
    const exercises = snapshot.exercises.filter(exercise => snapshot.sets.some(set => set.sessionExerciseId === exercise.id && set.status !== 'completed'));
    if (!exercises.length) return 0;
    let total = currentRestSeconds;
    for (const exercise of exercises) {
        const pending = snapshot.sets.filter(set => set.sessionExerciseId === exercise.id && set.status !== 'completed');
        total += pending.reduce((sum, set) => sum + estimatedSetSeconds(exercise.exerciseId, (set.targetRepsMin + set.targetRepsMax) / 2, profiles), 0);
        total += pending.slice(0, -1).reduce((sum, set) => sum + (set.restSeconds === 0 ? 0 : snapshot.session.restOverrideSeconds ?? set.restSeconds), 0);
        if (exercise.id !== snapshot.session.currentSessionExerciseId) total += 90;
    }
    if (activeElapsedSeconds !== undefined && currentRestSeconds === 0) {
        const current = snapshot.sets.find(set => set.id === snapshot.session.currentSetId && set.status !== 'completed');
        const exercise = snapshot.exercises.find(entry => entry.id === current?.sessionExerciseId);
        const latest = snapshot.sets.filter(set => set.status === 'completed').sort((a,b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
        if (current && exercise && (!latest || latest.sessionExerciseId === exercise.id)) {
            const previousElapsed = latest ? activeCompletion(latest,snapshot) : 0;
            if (previousElapsed !== undefined) {
                const previousRest = latest ? (latest.restSeconds === 0 ? 0 : snapshot.session.restOverrideSeconds ?? latest.restSeconds) : 0;
                const workSpent = Math.max(0,activeElapsedSeconds-previousElapsed-previousRest);
                total -= Math.min(workSpent,estimatedSetSeconds(exercise.exerciseId,(current.targetRepsMin+current.targetRepsMax)/2,profiles));
            }
        }
    }
    return Math.max(0,total);
}
