import {DexieDB} from '../db/db';
import {ActiveWorkoutSnapshot, CompleteSetInput, ExercisePerformanceSummary, PerformedSetRecord, ReplaceSessionExerciseInput, SessionExerciseRecord, StartWorkoutInput, WorkoutSessionRecord} from './types';
import {WorkoutRepository} from './WorkoutRepository';
import {calculateProgression, ProgressionKind} from '../generator/progression';
import {elapsedSeconds as calculateElapsedSeconds} from './elapsed';

export class WorkoutDomainError extends Error {
    constructor(public readonly code: 'WORKOUT_ACTIVE_SESSION_CONFLICT' | 'WORKOUT_DUPLICATE_SET_BLOCKED' | 'DB_INVARIANT_VIOLATION' | 'TIMER_OWNER_MISMATCH', message: string) {
        super(message);
        this.name = 'WorkoutDomainError';
    }
}

interface RepositoryClock {
    now: () => Date;
    id: () => string;
}

const defaultClock: RepositoryClock = {
    now: () => new Date(),
    id: () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
};

export const DEFAULT_EXERCISE_LOADS_META_KEY = 'defaultExerciseLoads:v1';
export const DEFAULT_EXERCISE_REPS_META_KEY = 'defaultExerciseReps:v1';

function parseDefaultLoads(value: string | undefined): Record<string, number> {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => Number.isFinite(entry[1]) && (entry[1] as number) >= 0));
    } catch { return {}; }
}

function parseDefaultReps(value: string | undefined): Record<string, number> {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => Number.isInteger(entry[1]) && (entry[1] as number) >= 1));
    } catch { return {}; }
}

export function orderSetsForExecution(exercises: SessionExerciseRecord[], sets: PerformedSetRecord[]): PerformedSetRecord[] {
    const exerciseOrder = new Map(exercises.map((exercise, index) => [exercise.id, index]));
    const blockOrder = new Map<string, number>();
    for (const exercise of exercises) {
        const key = exercise.groupIdSnapshot ?? exercise.id;
        blockOrder.set(key, Math.min(blockOrder.get(key) ?? Number.MAX_SAFE_INTEGER, exercise.sequenceIndex));
    }
    return [...sets].sort((left, right) => {
        const leftExercise = exercises.find((entry) => entry.id === left.sessionExerciseId)!;
        const rightExercise = exercises.find((entry) => entry.id === right.sessionExerciseId)!;
        const leftBlock = leftExercise.groupIdSnapshot ?? leftExercise.id;
        const rightBlock = rightExercise.groupIdSnapshot ?? rightExercise.id;
        const blockDifference = (blockOrder.get(leftBlock) ?? 0) - (blockOrder.get(rightBlock) ?? 0);
        if (blockDifference) return blockDifference;
        if (leftBlock === rightBlock && leftExercise.groupIdSnapshot) {
            return left.sequenceIndex - right.sequenceIndex
                || (leftExercise.groupSequenceIndexSnapshot ?? exerciseOrder.get(leftExercise.id) ?? 0)
                - (rightExercise.groupSequenceIndexSnapshot ?? exerciseOrder.get(rightExercise.id) ?? 0);
        }
        return (exerciseOrder.get(left.sessionExerciseId) ?? 0) - (exerciseOrder.get(right.sessionExerciseId) ?? 0)
            || left.sequenceIndex - right.sequenceIndex;
    });
}

export class DexieWorkoutRepository implements WorkoutRepository {
    constructor(private readonly db: DexieDB, private readonly clock: RepositoryClock = defaultClock) {}

    private iso(): string {
        return this.clock.now().toISOString();
    }

    private async snapshot(session: WorkoutSessionRecord): Promise<ActiveWorkoutSnapshot> {
        const exercises = await this.db.sessionExercise.where('sessionId').equals(session.id).sortBy('sequenceIndex');
        const sets = orderSetsForExecution(exercises, await this.db.performedSet.where('sessionId').equals(session.id).toArray());
        const timers = await this.db.restTimer.where('sessionId').equals(session.id).toArray();
        const timer = timers.filter((entry) => entry.status === 'running' || entry.status === 'paused').sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
        return {session, exercises, sets, timer};
    }

    async get(sessionId: string): Promise<ActiveWorkoutSnapshot | undefined> {
        const session = await this.db.workoutSession.get(sessionId);
        return session ? this.snapshot(session) : undefined;
    }

    async findActive(): Promise<ActiveWorkoutSnapshot | undefined> {
        const sessions = await this.db.workoutSession.where('status').anyOf('active', 'paused').toArray();
        if (sessions.length > 1) throw new WorkoutDomainError('WORKOUT_ACTIVE_SESSION_CONFLICT', 'Several active sessions require recovery.');
        return sessions[0] ? this.snapshot(sessions[0]) : undefined;
    }

    async exerciseHistory(exerciseId: string, excludeSessionId?: string): Promise<ExercisePerformanceSummary | undefined> {
        const matchingExercises = await this.db.sessionExercise.filter((entry) => entry.exerciseId === exerciseId && entry.sessionId !== excludeSessionId).toArray();
        const candidates = await Promise.all(matchingExercises.map(async (exercise) => {
            const session = await this.db.workoutSession.get(exercise.sessionId);
            if (!session || session.status !== 'completed') return undefined;
            const sets = (await this.db.performedSet.where('sessionExerciseId').equals(exercise.id).toArray())
                .filter((entry) => entry.status === 'completed' && entry.actualLoadKg !== undefined && entry.actualReps !== undefined)
                .sort((a, b) => a.sequenceIndex - b.sequenceIndex);
            const workingSets = sets.filter((entry) => (entry.setKind ?? 'working') === 'working');
            const suggested = [...workingSets, ...sets].at(-1);
            if (!sets.length || !suggested?.actualLoadKg && suggested?.actualLoadKg !== 0) return undefined;
            return {sessionId: session.id, sessionName: session.nameSnapshot, performedAt: session.endedAt ?? session.updatedAt, suggestedLoadKg: suggested.actualLoadKg, sets: sets.map((entry) => ({loadKg: entry.actualLoadKg!, reps: entry.actualReps!, ...(entry.actualRir === undefined ? {} : {rir: entry.actualRir})}))} satisfies ExercisePerformanceSummary;
        }));
        return candidates.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined).sort((a, b) => b.performedAt.localeCompare(a.performedAt))[0];
    }

    async repairPosition(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.restTimer], async () => {
            const session = await this.db.workoutSession.get(sessionId);
            if (!session || (session.status !== 'active' && session.status !== 'paused')) return;
            const snapshot = await this.snapshot(session);
            const current = snapshot.sets.find((entry) => entry.id === session.currentSetId && entry.status !== 'completed');
            if (current || snapshot.sets.every((entry) => entry.status === 'completed')) return;
            const next = snapshot.sets.find((entry) => entry.status !== 'completed');
            if (!next) return;
            const now = this.iso();
            await this.db.workoutSession.update(session.id, {currentSetId: next.id, currentSessionExerciseId: next.sessionExerciseId, updatedAt: now});
            for (const exercise of snapshot.exercises) {
                const exerciseSets = snapshot.sets.filter((entry) => entry.sessionExerciseId === exercise.id);
                const status = exercise.id === next.sessionExerciseId ? 'active' : exerciseSets.every((entry) => entry.status === 'completed') ? 'completed' : 'pending';
                if (exercise.status !== status) await this.db.sessionExercise.update(exercise.id, {status, updatedAt: now});
            }
        });
        const repaired = await this.get(sessionId);
        if (!repaired) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The repaired session could not be loaded.');
        return repaired;
    }

    async startSample(operationId: string): Promise<ActiveWorkoutSnapshot> {
        return this.startProgramDay({name: 'Essential workout', exercises: [
            {exerciseId: 'fedb:Goblet_Squat', exerciseName: 'Goblet Squat', prescriptionSnapshot: '3 × 8–10 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 10, targetLoadKg: 16, targetRir: 2, restSeconds: 75},
            {exerciseId: 'fedb:Bent_Over_Two-Dumbbell_Row', exerciseName: 'Bent Over Two-Dumbbell Row', prescriptionSnapshot: '3 × 10–12 · rest 60 s', workingSets: 3, repsMin: 10, repsMax: 12, targetLoadKg: 12, targetRir: 2, restSeconds: 60},
        ]}, operationId);
    }

    async startProgramDay(input: StartWorkoutInput, operationId: string): Promise<ActiveWorkoutSnapshot> {
        if (!input.exercises.length) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'A workout session needs at least one exercise.');
        const validInteger = (value: number, minimum: number) => Number.isFinite(value) && Number.isInteger(value) && value >= minimum;
        if (input.restOverrideSeconds !== undefined && !validInteger(input.restOverrideSeconds, 1)) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session rest override must be a positive whole number of seconds.');
        if (input.plannedDurationSeconds !== undefined && !validInteger(input.plannedDurationSeconds, 1)) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The planned session duration must be a positive whole number of seconds.');
        const invalidExercise = input.exercises.find((entry) => !validInteger(entry.workingSets, 1)
            || !validInteger(entry.warmupSets ?? 0, 0)
            || !validInteger(entry.dropSets ?? 0, 0)
            || !validInteger(entry.repsMin, 1)
            || !validInteger(entry.repsMax, entry.repsMin)
            || !validInteger(entry.restSeconds, 0)
            || !Number.isFinite(entry.targetLoadKg)
            || entry.targetLoadKg < 0
            || !Number.isFinite(entry.targetRir));
        if (invalidExercise) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', `Invalid prescription for ${invalidExercise.exerciseName}.`);
        const now = this.iso();
        const defaultLoads = parseDefaultLoads((await this.db.appMeta.get(DEFAULT_EXERCISE_LOADS_META_KEY))?.value);
        const defaultReps = parseDefaultReps((await this.db.appMeta.get(DEFAULT_EXERCISE_REPS_META_KEY))?.value);
        const resolvedLoads = new Map<string, number>();
        for (const entry of input.exercises) {
            const previous = defaultLoads[entry.exerciseId] === undefined ? await this.exerciseHistory(entry.exerciseId) : undefined;
            resolvedLoads.set(entry.exerciseId, defaultLoads[entry.exerciseId] ?? previous?.suggestedLoadKg ?? entry.targetLoadKg);
        }
        const sessionId = this.clock.id();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.workoutOperation], async () => {
            const prior = await this.db.workoutOperation.get(operationId);
            if (prior?.status === 'committed' && prior.sessionId) return;
            const active = await this.db.workoutSession.where('status').anyOf('active', 'paused').first();
            if (active) throw new WorkoutDomainError('WORKOUT_ACTIVE_SESSION_CONFLICT', 'An active session already exists.');
            await this.db.workoutOperation.put({operationId, kind: 'start', status: 'started', sessionId, startedAt: now});
            const exerciseIds = input.exercises.map(() => this.clock.id());
            const exercises: SessionExerciseRecord[] = input.exercises.map((entry, sequenceIndex) => ({id: exerciseIds[sequenceIndex], sessionId, exerciseId: entry.exerciseId, exerciseNameSnapshot: entry.exerciseName, prescriptionSnapshot: entry.prescriptionSnapshot, programExerciseId: entry.programExerciseId, lockedSnapshot: entry.locked ?? false, alternativeExerciseIdsSnapshot: [...(entry.alternativeExerciseIds ?? [])], groupIdSnapshot: entry.groupId, groupTypeSnapshot: entry.groupType ?? 'single', groupSequenceIndexSnapshot: entry.groupSequenceIndex ?? 0, setSchemeSnapshot: entry.setScheme ?? 'straight', sequenceIndex, status: sequenceIndex === 0 ? 'active' : 'pending', createdAt: now, updatedAt: now}));
            const sets: PerformedSetRecord[] = input.exercises.flatMap((entry, exerciseIndex) => {
                const warmupSets = Math.max(0, entry.warmupSets ?? 0);
                const dropSets = Math.max(0, entry.dropSets ?? 0);
                const scheme = entry.setScheme ?? 'straight';
                const workingLoadFactor = (index: number) => {
                    if (scheme === 'top-backoff') return index === 0 ? 1 : 0.9;
                    if (scheme === 'ramp' && entry.workingSets > 1) return 0.7 + (0.3 * index) / (entry.workingSets - 1);
                    return 1;
                };
                const rows: Array<{kind: 'warmup' | 'working' | 'drop'; loadFactor: number}> = [
                    ...Array.from({length: warmupSets}, (_, index) => ({kind: 'warmup' as const, loadFactor: warmupSets === 1 ? 0.6 : 0.5 + index * 0.2})),
                    ...Array.from({length: entry.workingSets}, (_, index) => ({kind: 'working' as const, loadFactor: workingLoadFactor(index)})),
                    ...Array.from({length: dropSets}, (_, index) => ({kind: 'drop' as const, loadFactor: Math.max(0.5, 0.8 - index * 0.1)})),
                ];
                const groupMembers = entry.groupId ? input.exercises.filter((candidate) => candidate.groupId === entry.groupId) : [];
                const isIntermediateGroupMember = Boolean(entry.groupId && (entry.groupSequenceIndex ?? 0) < groupMembers.length - 1);
                const baseLoad = resolvedLoads.get(entry.exerciseId) ?? entry.targetLoadKg;
                const savedRepetitions = defaultReps[entry.exerciseId];
                return rows.map((row, sequenceIndex) => ({id: this.clock.id(), sessionId, sessionExerciseId: exerciseIds[exerciseIndex], sequenceIndex, setKind: row.kind, status: 'planned' as const, targetRepsMin: row.kind === 'working' && savedRepetitions !== undefined ? savedRepetitions : entry.repsMin, targetRepsMax: row.kind === 'working' && savedRepetitions !== undefined ? savedRepetitions : entry.repsMax, targetLoadKg: Math.round(baseLoad * row.loadFactor * 10) / 10, targetRir: entry.targetRir, restSeconds: isIntermediateGroupMember ? 0 : entry.restSeconds, createdAt: now, updatedAt: now}));
            });
            const session: WorkoutSessionRecord = {id: sessionId, creationOperationId: operationId, nameSnapshot: input.name, programId: input.programId, programDayId: input.programDayId, status: 'active', startedAt: now, pausedDurationSeconds: 0, plannedDurationSeconds: input.plannedDurationSeconds, restOverrideSeconds: input.restOverrideSeconds, currentSessionExerciseId: exerciseIds[0], currentSetId: sets[0].id, createdAt: now, updatedAt: now};
            await this.db.workoutSession.add(session);
            await this.db.sessionExercise.bulkAdd(exercises);
            await this.db.performedSet.bulkAdd(sets);
            await this.db.workoutOperation.put({operationId, kind: 'start', status: 'committed', sessionId, startedAt: now, finishedAt: now});
        });
        const operation = await this.db.workoutOperation.get(operationId);
        const result = operation?.sessionId ? await this.get(operation.sessionId) : undefined;
        if (!result) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The created session could not be loaded.');
        return result;
    }

    async switchExercise(sessionId: string, sessionExerciseId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet], async () => {
            const session = await this.db.workoutSession.get(sessionId);
            const exercise = await this.db.sessionExercise.get(sessionExerciseId);
            if (!session || (session.status !== 'active' && session.status !== 'paused') || !exercise || exercise.sessionId !== sessionId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The selected exercise is not available in this session.');
            const next = (await this.db.performedSet.where('sessionExerciseId').equals(sessionExerciseId).sortBy('sequenceIndex')).find((entry) => entry.status !== 'completed');
            if (!next) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'All sets for this exercise are already complete.');
            const exercises = await this.db.sessionExercise.where('sessionId').equals(sessionId).toArray();
            for (const entry of exercises) {
                const sets = await this.db.performedSet.where('sessionExerciseId').equals(entry.id).toArray();
                const status = entry.id === exercise.id ? 'active' : sets.every((set) => set.status === 'completed') ? 'completed' : 'pending';
                if (entry.status !== status) await this.db.sessionExercise.update(entry.id, {status, updatedAt: now});
            }
            await this.db.workoutSession.update(sessionId, {currentSessionExerciseId: exercise.id, currentSetId: next.id, updatedAt: now});
        });
        return (await this.get(sessionId))!;
    }

    async replaceExercise(input: ReplaceSessionExerciseInput): Promise<ActiveWorkoutSnapshot> {
        if (!input.replacementExerciseId.trim() || !input.replacementExerciseName.trim()) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'A replacement exercise needs a stable identity and name.');
        const defaultLoads = parseDefaultLoads((await this.db.appMeta.get(DEFAULT_EXERCISE_LOADS_META_KEY))?.value);
        const previous = defaultLoads[input.replacementExerciseId] === undefined ? await this.exerciseHistory(input.replacementExerciseId, input.sessionId) : undefined;
        const replacementLoad = defaultLoads[input.replacementExerciseId] ?? previous?.suggestedLoadKg ?? 0;
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.workoutOperation], async () => {
            const prior = await this.db.workoutOperation.get(input.operationId);
            if (prior?.status === 'committed') return;
            const [session, exercise] = await Promise.all([
                this.db.workoutSession.get(input.sessionId),
                this.db.sessionExercise.get(input.sessionExerciseId),
            ]);
            if (!session || (session.status !== 'active' && session.status !== 'paused') || !exercise || exercise.sessionId !== input.sessionId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The selected exercise is not available in this session.');
            const duplicate = await this.db.sessionExercise.where('sessionId').equals(input.sessionId).filter((entry) => entry.id !== exercise.id && entry.exerciseId === input.replacementExerciseId).first();
            if (duplicate) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The replacement exercise is already in this session.');
            const sets = await this.db.performedSet.where('sessionExerciseId').equals(exercise.id).toArray();
            if (sets.some((entry) => entry.status === 'completed' || entry.completionOperationId || entry.actualLoadKg !== undefined || entry.actualReps !== undefined)) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'Replace this exercise before logging its first set. Use Do later after progress has been recorded.');
            await this.db.workoutOperation.put({operationId: input.operationId, kind: 'replace-exercise', status: 'started', sessionId: input.sessionId, entityId: exercise.id, startedAt: now});
            await this.db.sessionExercise.update(exercise.id, {
                exerciseId: input.replacementExerciseId,
                exerciseNameSnapshot: input.replacementExerciseName.trim(),
                originalExerciseIdSnapshot: exercise.originalExerciseIdSnapshot ?? exercise.exerciseId,
                originalExerciseNameSnapshot: exercise.originalExerciseNameSnapshot ?? exercise.exerciseNameSnapshot,
                substitutionReason: input.reason,
                alternativeExerciseIdsSnapshot: [...new Set(input.alternativeExerciseIds ?? [])].filter((id) => id !== input.replacementExerciseId),
                updatedAt: now,
            });
            await this.db.performedSet.where('sessionExerciseId').equals(exercise.id).filter((entry) => entry.status !== 'completed').modify({targetLoadKg: replacementLoad, updatedAt: now});
            await this.db.workoutOperation.put({operationId: input.operationId, kind: 'replace-exercise', status: 'committed', sessionId: input.sessionId, entityId: exercise.id, startedAt: now, finishedAt: now});
        });
        const result = await this.get(input.sessionId);
        if (!result) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session disappeared after exercise replacement.');
        return result;
    }

    async saveDefaultLoad(sessionId: string, sessionExerciseId: string, loadKg: number): Promise<ActiveWorkoutSnapshot> {
        if (!Number.isFinite(loadKg) || loadKg < 0) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The default load must be 0 kg or more.');
        const now = this.iso();
        await this.db.transaction('rw', [this.db.sessionExercise, this.db.performedSet, this.db.appMeta], async () => {
            const exercise = await this.db.sessionExercise.get(sessionExerciseId);
            if (!exercise || exercise.sessionId !== sessionId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The selected exercise is not available in this session.');
            const defaults = parseDefaultLoads((await this.db.appMeta.get(DEFAULT_EXERCISE_LOADS_META_KEY))?.value);
            defaults[exercise.exerciseId] = loadKg;
            await this.db.appMeta.put({key: DEFAULT_EXERCISE_LOADS_META_KEY, value: JSON.stringify(defaults), updatedAt: now});
            await this.db.performedSet.where('sessionExerciseId').equals(sessionExerciseId).filter((entry) => entry.status !== 'completed' && (entry.setKind ?? 'working') === 'working').modify({targetLoadKg: loadKg, updatedAt: now});
        });
        return (await this.get(sessionId))!;
    }

    async saveDefaultReps(sessionId: string, sessionExerciseId: string, repetitions: number): Promise<ActiveWorkoutSnapshot> {
        if (!Number.isInteger(repetitions) || repetitions < 1) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'Default repetitions must be a positive whole number.');
        const now = this.iso();
        await this.db.transaction('rw', [this.db.sessionExercise, this.db.performedSet, this.db.appMeta], async () => {
            const exercise = await this.db.sessionExercise.get(sessionExerciseId);
            if (!exercise || exercise.sessionId !== sessionId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The selected exercise is not available in this session.');
            const defaults = parseDefaultReps((await this.db.appMeta.get(DEFAULT_EXERCISE_REPS_META_KEY))?.value);
            defaults[exercise.exerciseId] = repetitions;
            await this.db.appMeta.put({key: DEFAULT_EXERCISE_REPS_META_KEY, value: JSON.stringify(defaults), updatedAt: now});
            await this.db.performedSet.where('sessionExerciseId').equals(sessionExerciseId).filter((entry) => entry.status !== 'completed' && (entry.setKind ?? 'working') === 'working').modify({targetRepsMin: repetitions, targetRepsMax: repetitions, updatedAt: now});
        });
        return (await this.get(sessionId))!;
    }

    async completeSet(input: CompleteSetInput): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.restTimer, this.db.workoutOperation], async () => {
            const prior = await this.db.workoutOperation.get(input.operationId);
            if (prior?.status === 'committed') return;
            const session = await this.db.workoutSession.get(input.sessionId);
            if (!session || session.status !== 'active') throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is not active.');
            const set = await this.db.performedSet.get(input.setId);
            if (!set || set.sessionId !== session.id || set.id !== session.currentSetId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The current set does not match the session position.');
            if (set.status === 'completed') throw new WorkoutDomainError('WORKOUT_DUPLICATE_SET_BLOCKED', 'This set is already completed.');
            await this.db.workoutOperation.put({operationId: input.operationId, kind: 'complete-set', status: 'started', sessionId: session.id, entityId: set.id, startedAt: now});
            await this.db.performedSet.update(set.id, {status: 'completed', actualLoadKg: input.actualLoadKg, actualReps: input.actualReps, actualRir: input.actualRir, completionOperationId: input.operationId, completedAt: now, updatedAt: now});
            const allSets = await this.db.performedSet.where('sessionId').equals(session.id).toArray();
            const exercises = await this.db.sessionExercise.where('sessionId').equals(session.id).sortBy('sequenceIndex');
            const ordered = orderSetsForExecution(exercises, allSets);
            const currentPosition = ordered.findIndex((entry) => entry.id === set.id);
            const wasManualDetour = currentPosition > 0 && ordered.slice(0, currentPosition).some((entry) => entry.status === 'planned');
            const nextInDetour = wasManualDetour ? ordered.find((entry) => entry.sessionExerciseId === set.sessionExerciseId && entry.status === 'planned' && entry.id !== set.id) : undefined;
            const next = nextInDetour ?? ordered.find((entry) => entry.status === 'planned' && entry.id !== set.id);
            const remainingCurrent = ordered.some((entry) => entry.sessionExerciseId === set.sessionExerciseId && entry.status === 'planned' && entry.id !== set.id);
            if (!remainingCurrent) await this.db.sessionExercise.update(set.sessionExerciseId, {status: 'completed', updatedAt: now});
            if (next && next.sessionExerciseId !== set.sessionExerciseId) await this.db.sessionExercise.update(next.sessionExerciseId, {status: 'active', updatedAt: now});
            await this.db.workoutSession.update(session.id, {currentSessionExerciseId: next?.sessionExerciseId ?? set.sessionExerciseId, currentSetId: next?.id ?? set.id, updatedAt: now});
            await this.db.restTimer.where('sessionId').equals(session.id).modify({status: 'cancelled', updatedAt: now});
            const effectiveRestSeconds = set.restSeconds === 0 ? 0 : (session.restOverrideSeconds ?? set.restSeconds);
            if (effectiveRestSeconds > 0) {
                const endsAt = new Date(this.clock.now().getTime() + effectiveRestSeconds * 1000).toISOString();
                await this.db.restTimer.put({id: this.clock.id(), sessionId: session.id, performedSetId: set.id, startedAt: now, endsAt, status: 'running', createdAt: now, updatedAt: now});
            }
            await this.db.workoutOperation.put({operationId: input.operationId, kind: 'complete-set', status: 'committed', sessionId: session.id, entityId: set.id, startedAt: now, finishedAt: now});
        });
        const result = await this.get(input.sessionId);
        if (!result) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session disappeared after set completion.');
        return result;
    }

    async undoSet(sessionId: string, setId: string, operationId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.restTimer, this.db.workoutOperation], async () => {
            if ((await this.db.workoutOperation.get(operationId))?.status === 'committed') return;
            const session = await this.db.workoutSession.get(sessionId);
            const set = await this.db.performedSet.get(setId);
            if (!session || !set || set.sessionId !== sessionId || set.status !== 'completed') throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'Only a completed set can be undone.');
            const completed = (await this.db.performedSet.where('sessionId').equals(sessionId).toArray()).filter((entry) => entry.status === 'completed').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
            if (completed[0]?.id !== set.id) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'Only the latest completed set can be undone.');
            await this.db.workoutOperation.put({operationId, kind: 'undo-set', status: 'started', sessionId, entityId: set.id, startedAt: now});
            await this.db.performedSet.update(set.id, {status: 'undone', undoOperationId: operationId, updatedAt: now});
            await this.db.sessionExercise.update(set.sessionExerciseId, {status: 'active', updatedAt: now});
            await this.db.workoutSession.update(sessionId, {currentSessionExerciseId: set.sessionExerciseId, currentSetId: set.id, updatedAt: now});
            await this.db.restTimer.where('sessionId').equals(sessionId).modify({status: 'cancelled', updatedAt: now});
            await this.db.workoutOperation.put({operationId, kind: 'undo-set', status: 'committed', sessionId, entityId: set.id, startedAt: now, finishedAt: now});
        });
        return (await this.get(sessionId))!;
    }

    async pause(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.restTimer], async () => {
            const session = await this.db.workoutSession.get(sessionId);
            if (!session || session.status !== 'active') throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is not active.');
            await this.db.workoutSession.update(sessionId, {status: 'paused', pausedAt: now, updatedAt: now});
            const timer = (await this.db.restTimer.where('sessionId').equals(sessionId).toArray()).find((entry) => entry.status === 'running');
            if (timer) {
                const remaining = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - this.clock.now().getTime()) / 1000));
                await this.db.restTimer.update(timer.id, {status: 'paused', pausedAt: now, remainingWhenPausedSeconds: remaining, updatedAt: now});
            }
        });
        return (await this.get(sessionId))!;
    }

    async resume(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const session = await this.db.workoutSession.get(sessionId);
        if (!session || session.status !== 'paused') throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is not paused.');
        const nowDate = this.clock.now();
        const pausedFor = session.pausedAt ? Math.max(0, Math.floor((nowDate.getTime() - new Date(session.pausedAt).getTime()) / 1000)) : 0;
        await this.db.transaction('rw', [this.db.workoutSession, this.db.restTimer], async () => {
            await this.db.workoutSession.update(sessionId, {status: 'active', pausedAt: undefined, pausedDurationSeconds: session.pausedDurationSeconds + pausedFor, updatedAt: nowDate.toISOString()});
            const timer = (await this.db.restTimer.where('sessionId').equals(sessionId).toArray()).find((entry) => entry.status === 'paused');
            if (timer) await this.db.restTimer.update(timer.id, {status: 'running', pausedAt: undefined, endsAt: new Date(nowDate.getTime() + (timer.remainingWhenPausedSeconds ?? 0) * 1000).toISOString(), updatedAt: nowDate.toISOString()});
        });
        return (await this.get(sessionId))!;
    }

    async adjustTimer(sessionId: string, seconds: number): Promise<ActiveWorkoutSnapshot> {
        const timer = (await this.get(sessionId))?.timer;
        if (!timer) return (await this.get(sessionId))!;
        if (timer.status === 'paused') await this.db.restTimer.update(timer.id, {remainingWhenPausedSeconds: Math.max(0, (timer.remainingWhenPausedSeconds ?? 0) + seconds), updatedAt: this.iso()});
        else await this.db.restTimer.update(timer.id, {endsAt: new Date(new Date(timer.endsAt).getTime() + seconds * 1000).toISOString(), updatedAt: this.iso()});
        return (await this.get(sessionId))!;
    }

    async setRestOverride(sessionId: string, seconds: number | undefined): Promise<ActiveWorkoutSnapshot> {
        if (seconds !== undefined && (!Number.isInteger(seconds) || seconds <= 0)) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session rest override must be a positive whole number of seconds.');
        const session = await this.db.workoutSession.get(sessionId);
        if (!session || (session.status !== 'active' && session.status !== 'paused')) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is not active.');
        await this.db.workoutSession.update(sessionId, {restOverrideSeconds: seconds, updatedAt: this.iso()});
        return (await this.get(sessionId))!;
    }

    async pauseTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const timer = (await this.get(sessionId))?.timer;
        if (timer?.status === 'running') {
            const remaining = Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - this.clock.now().getTime()) / 1000));
            await this.db.restTimer.update(timer.id, {status: 'paused', pausedAt: this.iso(), remainingWhenPausedSeconds: remaining, updatedAt: this.iso()});
        }
        return (await this.get(sessionId))!;
    }

    async resumeTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const timer = (await this.get(sessionId))?.timer;
        if (timer?.status === 'paused') {
            const now = this.clock.now();
            await this.db.restTimer.update(timer.id, {status: 'running', pausedAt: undefined, endsAt: new Date(now.getTime() + (timer.remainingWhenPausedSeconds ?? 0) * 1000).toISOString(), updatedAt: now.toISOString()});
        }
        return (await this.get(sessionId))!;
    }

    async skipTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const timer = (await this.get(sessionId))?.timer;
        if (timer) await this.db.restTimer.update(timer.id, {status: 'cancelled', updatedAt: this.iso()});
        return (await this.get(sessionId))!;
    }

    async abandon(sessionId: string, operationId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.restTimer, this.db.workoutOperation], async () => {
            if ((await this.db.workoutOperation.get(operationId))?.status === 'committed') return;
            const session = await this.db.workoutSession.get(sessionId);
            if (!session) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session does not exist.');
            if (session.status === 'abandoned') return;
            if (session.status !== 'active' && session.status !== 'paused') throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'Only an active workout can be replaced.');
            await this.db.workoutOperation.put({operationId, kind: 'abandon', status: 'started', sessionId, startedAt: now});
            const elapsedSeconds = calculateElapsedSeconds(session, this.clock.now().getTime());
            await this.db.workoutSession.update(sessionId, {status: 'abandoned', endedAt: now, elapsedSeconds, updatedAt: now});
            await this.db.restTimer.where('sessionId').equals(sessionId).modify({status: 'cancelled', updatedAt: now});
            await this.db.workoutOperation.put({operationId, kind: 'abandon', status: 'committed', sessionId, startedAt: now, finishedAt: now});
        });
        const result = await this.get(sessionId);
        if (!result) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The replaced session could not be loaded.');
        return result;
    }

    async finish(sessionId: string, operationId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.restTimer, this.db.workoutOperation, this.db.trainingProgram, this.db.programExercise, this.db.exercisePrescription, this.db.progressionRule, this.db.progressionProposal], async () => {
            if ((await this.db.workoutOperation.get(operationId))?.status === 'committed') return;
            const session = await this.db.workoutSession.get(sessionId);
            if (!session) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session does not exist.');
            if (session.status === 'completed' && session.finishOperationId !== operationId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is already completed.');
            await this.db.workoutOperation.put({operationId, kind: 'finish', status: 'started', sessionId, startedAt: now});
            const elapsedSeconds = calculateElapsedSeconds(session, this.clock.now().getTime());
            await this.db.workoutSession.update(sessionId, {status: 'completed', finishOperationId: operationId, endedAt: now, elapsedSeconds, updatedAt: now});
            if (session.programId) {
                const sessionExercises = await this.db.sessionExercise.where('sessionId').equals(session.id).toArray();
                const performedSets = await this.db.performedSet.where('sessionId').equals(session.id).toArray();
                for (const sessionExercise of sessionExercises.filter((entry) => entry.programExerciseId)) {
                    const programExercise = await this.db.programExercise.get(sessionExercise.programExerciseId!);
                    if (!programExercise) continue;
                    const [prescription, rule] = await Promise.all([this.db.exercisePrescription.get(programExercise.prescriptionId), this.db.progressionRule.get(programExercise.progressionRuleId)]);
                    if (!prescription || !rule) continue;
                    const relevant = performedSets.filter((entry) => entry.sessionExerciseId === sessionExercise.id);
                    const proposal = calculateProgression({exerciseId: sessionExercise.exerciseId, kind: (rule.kind === 'load-after-success' ? 'fixed-increment' : rule.kind === 'manual' ? 'manual-hold' : rule.kind) as ProgressionKind, sets: relevant.map((entry) => ({reps: entry.actualReps ?? 0, loadKg: entry.actualLoadKg ?? entry.targetLoadKg, rir: entry.actualRir, completed: entry.status === 'completed'})), repsMax: prescription.repsMax, targetRir: prescription.targetRir, currentLoadKg: prescription.loadReferenceKg, incrementKg: 2.5, comparableMisses: 0, discomfort: false, conditioningSeconds: undefined, createdAt: now});
                    await this.db.progressionProposal.put({...proposal, id: `progression:${session.id}:${programExercise.id}`, sessionId: session.id, programId: session.programId, programExerciseId: programExercise.id, prescriptionId: prescription.id, updatedAt: now});
                }
            }
            if (session.programId) {
                const program = await this.db.trainingProgram.get(session.programId);
                if (program) await this.db.trainingProgram.update(program.id, {currentDayIndex: (program.currentDayIndex + 1) % program.weeklyFrequency, updatedAt: now});
            }
            await this.db.restTimer.where('sessionId').equals(sessionId).modify({status: 'cancelled', updatedAt: now});
            await this.db.workoutOperation.put({operationId, kind: 'finish', status: 'committed', sessionId, startedAt: now, finishedAt: now});
        });
        return (await this.get(sessionId))!;
    }
}
