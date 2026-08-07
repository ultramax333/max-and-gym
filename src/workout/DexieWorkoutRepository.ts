import {DexieDB} from '../db/db';
import {ActiveWorkoutSnapshot, CompleteSetInput, PerformedSetRecord, SessionExerciseRecord, StartWorkoutInput, WorkoutSessionRecord} from './types';
import {WorkoutRepository} from './WorkoutRepository';
import {calculateProgression, ProgressionKind} from '../generator/progression';

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

export class DexieWorkoutRepository implements WorkoutRepository {
    constructor(private readonly db: DexieDB, private readonly clock: RepositoryClock = defaultClock) {}

    private iso(): string {
        return this.clock.now().toISOString();
    }

    private async snapshot(session: WorkoutSessionRecord): Promise<ActiveWorkoutSnapshot> {
        const exercises = await this.db.sessionExercise.where('sessionId').equals(session.id).sortBy('sequenceIndex');
        const sets = (await this.db.performedSet.where('sessionId').equals(session.id).toArray()).sort((a, b) => {
            const exerciseOrder = exercises.findIndex((entry) => entry.id === a.sessionExerciseId) - exercises.findIndex((entry) => entry.id === b.sessionExerciseId);
            return exerciseOrder || a.sequenceIndex - b.sequenceIndex;
        });
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

    async startSample(operationId: string): Promise<ActiveWorkoutSnapshot> {
        return this.startProgramDay({name: 'Essential workout', exercises: [
            {exerciseId: 'fedb:Goblet_Squat', exerciseName: 'Goblet Squat', prescriptionSnapshot: '3 × 8–10 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 10, targetLoadKg: 16, targetRir: 2, restSeconds: 75},
            {exerciseId: 'fedb:Bent_Over_Two-Dumbbell_Row', exerciseName: 'Bent Over Two-Dumbbell Row', prescriptionSnapshot: '3 × 10–12 · rest 60 s', workingSets: 3, repsMin: 10, repsMax: 12, targetLoadKg: 12, targetRir: 2, restSeconds: 60},
        ]}, operationId);
    }

    async startProgramDay(input: StartWorkoutInput, operationId: string): Promise<ActiveWorkoutSnapshot> {
        if (!input.exercises.length) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'A workout session needs at least one exercise.');
        const now = this.iso();
        const sessionId = this.clock.id();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.workoutOperation], async () => {
            const prior = await this.db.workoutOperation.get(operationId);
            if (prior?.status === 'committed' && prior.sessionId) return;
            const active = await this.db.workoutSession.where('status').anyOf('active', 'paused').first();
            if (active) throw new WorkoutDomainError('WORKOUT_ACTIVE_SESSION_CONFLICT', 'An active session already exists.');
            await this.db.workoutOperation.put({operationId, kind: 'start', status: 'started', sessionId, startedAt: now});
            const exerciseIds = input.exercises.map(() => this.clock.id());
            const exercises: SessionExerciseRecord[] = input.exercises.map((entry, sequenceIndex) => ({id: exerciseIds[sequenceIndex], sessionId, exerciseId: entry.exerciseId, exerciseNameSnapshot: entry.exerciseName, prescriptionSnapshot: entry.prescriptionSnapshot, programExerciseId: entry.programExerciseId, lockedSnapshot: entry.locked ?? false, alternativeExerciseIdsSnapshot: [...(entry.alternativeExerciseIds ?? [])], sequenceIndex, status: sequenceIndex === 0 ? 'active' : 'pending', createdAt: now, updatedAt: now}));
            const sets: PerformedSetRecord[] = input.exercises.flatMap((entry, exerciseIndex) => Array.from({length: entry.workingSets}, (_, sequenceIndex) => ({id: this.clock.id(), sessionId, sessionExerciseId: exerciseIds[exerciseIndex], sequenceIndex, status: 'planned' as const, targetRepsMin: entry.repsMin, targetRepsMax: entry.repsMax, targetLoadKg: entry.targetLoadKg, targetRir: entry.targetRir, restSeconds: entry.restSeconds, createdAt: now, updatedAt: now})));
            const session: WorkoutSessionRecord = {id: sessionId, creationOperationId: operationId, nameSnapshot: input.name, programId: input.programId, programDayId: input.programDayId, status: 'active', startedAt: now, pausedDurationSeconds: 0, currentSessionExerciseId: exerciseIds[0], currentSetId: sets[0].id, createdAt: now, updatedAt: now};
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
            const ordered = allSets.sort((a, b) => {
                const order = exercises.findIndex((entry) => entry.id === a.sessionExerciseId) - exercises.findIndex((entry) => entry.id === b.sessionExerciseId);
                return order || a.sequenceIndex - b.sequenceIndex;
            });
            const next = ordered.find((entry) => entry.status === 'planned' && entry.id !== set.id);
            const remainingCurrent = ordered.some((entry) => entry.sessionExerciseId === set.sessionExerciseId && entry.status === 'planned' && entry.id !== set.id);
            if (!remainingCurrent) await this.db.sessionExercise.update(set.sessionExerciseId, {status: 'completed', updatedAt: now});
            if (next && next.sessionExerciseId !== set.sessionExerciseId) await this.db.sessionExercise.update(next.sessionExerciseId, {status: 'active', updatedAt: now});
            await this.db.workoutSession.update(session.id, {currentSessionExerciseId: next?.sessionExerciseId ?? set.sessionExerciseId, currentSetId: next?.id ?? set.id, updatedAt: now});
            await this.db.restTimer.where('sessionId').equals(session.id).modify({status: 'cancelled', updatedAt: now});
            const endsAt = new Date(this.clock.now().getTime() + set.restSeconds * 1000).toISOString();
            await this.db.restTimer.put({id: this.clock.id(), sessionId: session.id, performedSetId: set.id, startedAt: now, endsAt, status: 'running', createdAt: now, updatedAt: now});
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

    async finish(sessionId: string, operationId: string): Promise<ActiveWorkoutSnapshot> {
        const now = this.iso();
        await this.db.transaction('rw', [this.db.workoutSession, this.db.sessionExercise, this.db.performedSet, this.db.restTimer, this.db.workoutOperation, this.db.trainingProgram, this.db.programExercise, this.db.exercisePrescription, this.db.progressionRule, this.db.progressionProposal], async () => {
            if ((await this.db.workoutOperation.get(operationId))?.status === 'committed') return;
            const session = await this.db.workoutSession.get(sessionId);
            if (!session) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session does not exist.');
            if (session.status === 'completed' && session.finishOperationId !== operationId) throw new WorkoutDomainError('DB_INVARIANT_VIOLATION', 'The session is already completed.');
            await this.db.workoutOperation.put({operationId, kind: 'finish', status: 'started', sessionId, startedAt: now});
            const elapsedSeconds = Math.max(0, Math.floor((this.clock.now().getTime() - new Date(session.startedAt).getTime()) / 1000) - session.pausedDurationSeconds);
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
