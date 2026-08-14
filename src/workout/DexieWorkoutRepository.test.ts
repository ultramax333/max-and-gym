import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {DexieWorkoutRepository, WorkoutDomainError} from './DexieWorkoutRepository';

describe('DexieWorkoutRepository', () => {
    let db: DexieDB;
    let nowMs: number;
    let idSequence: number;
    let repository: DexieWorkoutRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        nowMs = Date.parse('2026-08-06T18:00:00.000Z');
        idSequence = 0;
        db = new DexieDB();
        repository = new DexieWorkoutRepository(db, {
            now: () => new Date(nowMs),
            id: () => `id-${++idSequence}`,
        });
    });

    afterEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('creates one active session transactionally and replays the same operation', async () => {
        const first = await repository.startSample('start-1');
        const replay = await repository.startSample('start-1');
        expect(replay.session.id).toBe(first.session.id);
        expect(await db.workoutSession.count()).toBe(1);
        expect(first.sets).toHaveLength(6);
        await expect(repository.startSample('start-2')).rejects.toMatchObject({code: 'WORKOUT_ACTIVE_SESSION_CONFLICT'});
    });

    it('snapshots planned duration independently from actual elapsed time', async () => {
        const started = await repository.startProgramDay({name: 'Timed workout', plannedDurationSeconds: 2400, exercises: [{exerciseId: 'curl', exerciseName: 'Curl', prescriptionSnapshot: '1 x 10', workingSets: 1, repsMin: 10, repsMax: 10, targetLoadKg: 10, targetRir: 2, restSeconds: 60}]}, 'timed-start');
        expect(started.session.plannedDurationSeconds).toBe(2400);
        nowMs += 35 * 60_000;
        const finished = await repository.finish(started.session.id, 'timed-finish');
        expect(finished.session.elapsedSeconds).toBe(2100);
        expect(finished.session.plannedDurationSeconds).toBe(2400);
    });

    it('completes a set idempotently and advances position with one timestamp timer', async () => {
        const started = await repository.startSample('start');
        const set = started.sets[0];
        const input = {sessionId: started.session.id, setId: set.id, operationId: 'complete-1', actualLoadKg: 18, actualReps: 9, actualRir: 2};
        const completed = await repository.completeSet(input);
        const replay = await repository.completeSet(input);
        expect(replay.sets.filter((entry) => entry.status === 'completed')).toHaveLength(1);
        expect(replay.session.currentSetId).toBe(started.sets[1].id);
        expect(completed.timer?.endsAt).toBe('2026-08-06T18:01:15.000Z');
        expect(await db.restTimer.count()).toBe(1);
    });

    it('switches to the next incomplete set of another exercise without losing progress', async () => {
        const started = await repository.startSample('start-switch');
        const secondExercise = started.exercises[1];
        const switched = await repository.switchExercise(started.session.id, secondExercise.id);
        expect(switched.session.currentSessionExerciseId).toBe(secondExercise.id);
        expect(switched.session.currentSetId).toBe(switched.sets.find((entry) => entry.sessionExerciseId === secondExercise.id)?.id);
        expect(switched.sets.every((entry) => entry.status === 'planned')).toBe(true);
        expect(switched.exercises.find((entry) => entry.id === secondExercise.id)?.status).toBe('active');
        expect(switched.exercises[0].status).toBe('pending');
        const completed = await repository.completeSet({sessionId: switched.session.id, setId: switched.session.currentSetId, operationId: 'switch-complete', actualLoadKg: 12, actualReps: 10});
        expect(completed.session.currentSessionExerciseId).toBe(secondExercise.id);
        expect(completed.sets.find((entry) => entry.id === completed.session.currentSetId)?.sequenceIndex).toBe(1);
    });

    it('uses the latest completed working load on the next session', async () => {
        let snapshot = await repository.startSample('history-start');
        for (let index = 0; index < 3; index += 1) {
            const current = snapshot.sets.find((entry) => entry.id === snapshot.session.currentSetId)!;
            snapshot = await repository.completeSet({sessionId: snapshot.session.id, setId: current.id, operationId: `history-set-${index}`, actualLoadKg: 22, actualReps: 9});
        }
        await repository.finish(snapshot.session.id, 'history-finish');
        const next = await repository.startSample('history-next');
        expect(next.sets.filter((entry) => entry.sessionExerciseId === next.exercises[0].id).map((entry) => entry.targetLoadKg)).toEqual([22, 22, 22]);
        expect(await repository.exerciseHistory(next.exercises[0].exerciseId, next.session.id)).toMatchObject({suggestedLoadKg: 22, sets: expect.arrayContaining([expect.objectContaining({loadKg: 22, reps: 9})])});
    });

    it('saves an explicit default load and applies it to every remaining working set', async () => {
        const started = await repository.startSample('default-start');
        const updated = await repository.saveDefaultLoad(started.session.id, started.exercises[0].id, 24);
        expect(updated.sets.filter((entry) => entry.sessionExerciseId === started.exercises[0].id).map((entry) => entry.targetLoadKg)).toEqual([24, 24, 24]);
        await repository.finish(started.session.id, 'default-finish');
        const next = await repository.startSample('default-next');
        expect(next.sets.filter((entry) => entry.sessionExerciseId === next.exercises[0].id).map((entry) => entry.targetLoadKg)).toEqual([24, 24, 24]);
    });

    it('records exact actual repetitions and applies a saved repetition default only to remaining working sets', async () => {
        let snapshot = await repository.startSample('default-reps-start');
        const firstSet = snapshot.sets[0];
        snapshot = await repository.completeSet({sessionId: snapshot.session.id, setId: firstSet.id, operationId: 'actual-five', actualLoadKg: 16, actualReps: 5});
        snapshot = await repository.saveDefaultReps(snapshot.session.id, snapshot.exercises[0].id, 6);

        expect(snapshot.sets.find((entry) => entry.id === firstSet.id)).toMatchObject({status: 'completed', actualReps: 5, targetRepsMin: 8, targetRepsMax: 10});
        expect(snapshot.sets.filter((entry) => entry.sessionExerciseId === snapshot.exercises[0].id && entry.status !== 'completed').map((entry) => [entry.targetRepsMin, entry.targetRepsMax])).toEqual([[6, 6], [6, 6]]);

        await repository.finish(snapshot.session.id, 'default-reps-finish');
        const next = await repository.startSample('default-reps-next');
        expect(next.sets.filter((entry) => entry.sessionExerciseId === next.exercises[0].id).map((entry) => [entry.targetRepsMin, entry.targetRepsMax])).toEqual([[6, 6], [6, 6], [6, 6]]);
    });

    it('repairs a stale pointer to a completed set without losing progress', async () => {
        const started = await repository.startSample('start');
        const completed = await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete', actualLoadKg: 16, actualReps: 10});
        await db.workoutSession.update(started.session.id, {currentSetId: started.sets[0].id, currentSessionExerciseId: started.exercises[0].id});

        const repaired = await repository.repairPosition(started.session.id);

        expect(repaired.session.currentSetId).toBe(completed.sets[1].id);
        expect(repaired.session.currentSessionExerciseId).toBe(started.exercises[0].id);
        expect(repaired.sets.filter((entry) => entry.status === 'completed')).toHaveLength(1);
        expect(repaired.sets.find((entry) => entry.id === repaired.session.currentSetId)?.status).toBe('planned');
    });

    it('rolls back all writes when set ownership validation fails', async () => {
        const started = await repository.startSample('start');
        await expect(repository.completeSet({sessionId: started.session.id, setId: 'missing', operationId: 'bad-complete', actualLoadKg: 1, actualReps: 1})).rejects.toBeInstanceOf(WorkoutDomainError);
        expect((await repository.get(started.session.id))?.sets.every((entry) => entry.status === 'planned')).toBe(true);
        expect(await db.workoutOperation.get('bad-complete')).toBeUndefined();
    });

    it('undoes only the latest completed set and restores the exact position', async () => {
        const started = await repository.startSample('start');
        await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete', actualLoadKg: 16, actualReps: 10});
        const undone = await repository.undoSet(started.session.id, started.sets[0].id, 'undo');
        expect(undone.session.currentSetId).toBe(started.sets[0].id);
        expect(undone.sets[0].status).toBe('undone');
        expect(undone.timer).toBeUndefined();
    });

    it('reconciles pause/resume and timer adjustments from timestamps', async () => {
        const started = await repository.startSample('start');
        let snapshot = await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete', actualLoadKg: 16, actualReps: 10});
        nowMs += 15_000;
        snapshot = await repository.pauseTimer(snapshot.session.id);
        expect(snapshot.timer?.remainingWhenPausedSeconds).toBe(60);
        snapshot = await repository.adjustTimer(snapshot.session.id, 15);
        expect(snapshot.timer?.remainingWhenPausedSeconds).toBe(75);
        nowMs += 30_000;
        snapshot = await repository.resumeTimer(snapshot.session.id);
        expect(snapshot.timer?.endsAt).toBe('2026-08-06T18:02:00.000Z');
    });

    it('persists a global session rest and applies it to future timers only', async () => {
        const started = await repository.startSample('start');
        let snapshot = await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete-1', actualLoadKg: 16, actualReps: 10});
        expect(snapshot.timer?.endsAt).toBe('2026-08-06T18:01:15.000Z');

        snapshot = await repository.setRestOverride(snapshot.session.id, 180);
        expect(snapshot.session.restOverrideSeconds).toBe(180);
        expect(snapshot.timer?.endsAt).toBe('2026-08-06T18:01:15.000Z');

        snapshot = await repository.completeSet({sessionId: snapshot.session.id, setId: snapshot.session.currentSetId, operationId: 'complete-2', actualLoadKg: 16, actualReps: 10});
        expect(snapshot.timer?.endsAt).toBe('2026-08-06T18:03:00.000Z');
        expect((await repository.get(snapshot.session.id))?.session.restOverrideSeconds).toBe(180);
    });

    it('pauses and resumes the session and owned timer atomically', async () => {
        const started = await repository.startSample('start');
        let snapshot = await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete', actualLoadKg: 16, actualReps: 10});
        nowMs += 5_000;
        snapshot = await repository.pause(snapshot.session.id);
        expect(snapshot.session.status).toBe('paused');
        expect(snapshot.timer?.status).toBe('paused');
        nowMs += 20_000;
        snapshot = await repository.resume(snapshot.session.id);
        expect(snapshot.session.status).toBe('active');
        expect(snapshot.timer?.status).toBe('running');
        expect(snapshot.session.pausedDurationSeconds).toBe(20);
    });

    it('finishes once and returns the same result on retry', async () => {
        const started = await repository.startSample('start');
        nowMs += 120_000;
        const finished = await repository.finish(started.session.id, 'finish');
        const replay = await repository.finish(started.session.id, 'finish');
        expect(replay.session.status).toBe('completed');
        expect(replay.session.endedAt).toBe(finished.session.endedAt);
        expect(replay.session.elapsedSeconds).toBe(120);
        expect(await repository.findActive()).toBeUndefined();
    });

    it('excludes an open pause when finishing the workout', async () => {
        const started = await repository.startSample('paused-finish-start');
        nowMs += 5 * 60_000;
        await repository.pause(started.session.id);
        nowMs += 20 * 60_000;
        const finished = await repository.finish(started.session.id, 'paused-finish');
        expect(finished.session.elapsedSeconds).toBe(5 * 60);
    });

    it('abandons a replaced workout without deleting its completed sets', async () => {
        const started = await repository.startSample('start');
        await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'complete', actualLoadKg: 16, actualReps: 10});
        nowMs += 120_000;

        const abandoned = await repository.abandon(started.session.id, 'abandon');

        expect(abandoned.session.status).toBe('abandoned');
        expect(abandoned.session.elapsedSeconds).toBe(120);
        expect(abandoned.sets.filter((entry) => entry.status === 'completed')).toHaveLength(1);
        expect(abandoned.timer).toBeUndefined();
        expect(await repository.findActive()).toBeUndefined();
    });

    it('runs a superset round by round with warm-up and drop-set snapshots', async () => {
        const started = await repository.startProgramDay({name: 'Arms', exercises: [
            {exerciseId: 'curl', exerciseName: 'Curl', prescriptionSnapshot: 'advanced', workingSets: 2, repsMin: 8, repsMax: 12, targetLoadKg: 20, targetRir: 2, restSeconds: 75, groupId: 'arms', groupType: 'superset', groupSequenceIndex: 0, setScheme: 'drop', warmupSets: 1, dropSets: 1},
            {exerciseId: 'extension', exerciseName: 'Extension', prescriptionSnapshot: 'advanced', workingSets: 2, repsMin: 8, repsMax: 12, targetLoadKg: 16, targetRir: 2, restSeconds: 75, groupId: 'arms', groupType: 'superset', groupSequenceIndex: 1, setScheme: 'straight', warmupSets: 1},
        ]}, 'start-group');

        await repository.setRestOverride(started.session.id, 180);

        expect(started.sets.map((entry) => [entry.sessionExerciseId, entry.setKind])).toEqual([
            [started.exercises[0].id, 'warmup'], [started.exercises[1].id, 'warmup'],
            [started.exercises[0].id, 'working'], [started.exercises[1].id, 'working'],
            [started.exercises[0].id, 'working'], [started.exercises[1].id, 'working'],
            [started.exercises[0].id, 'drop'],
        ]);
        const afterCurl = await repository.completeSet({sessionId: started.session.id, setId: started.sets[0].id, operationId: 'curl-warmup', actualLoadKg: 12, actualReps: 10});
        expect(afterCurl.session.currentSetId).toBe(started.sets[1].id);
        expect(afterCurl.timer).toBeUndefined();
        const afterExtension = await repository.completeSet({sessionId: started.session.id, setId: started.sets[1].id, operationId: 'extension-warmup', actualLoadKg: 10, actualReps: 10});
        expect(afterExtension.session.currentSetId).toBe(started.sets[2].id);
        expect(afterExtension.timer?.endsAt).toBe('2026-08-06T18:03:00.000Z');
    });

    it('applies ramp and top/back-off load targets', async () => {
        const started = await repository.startProgramDay({name: 'Load schemes', exercises: [
            {exerciseId: 'ramp', exerciseName: 'Ramp', prescriptionSnapshot: 'ramp', workingSets: 4, repsMin: 5, repsMax: 8, targetLoadKg: 100, targetRir: 2, restSeconds: 90, setScheme: 'ramp'},
            {exerciseId: 'backoff', exerciseName: 'Top and back-off', prescriptionSnapshot: 'top-backoff', workingSets: 3, repsMin: 5, repsMax: 8, targetLoadKg: 100, targetRir: 2, restSeconds: 90, setScheme: 'top-backoff'},
        ]}, 'start-load-schemes');

        const rampSets = started.sets.filter((entry) => entry.sessionExerciseId === started.exercises[0].id);
        const backoffSets = started.sets.filter((entry) => entry.sessionExerciseId === started.exercises[1].id);
        expect(rampSets.map((entry) => entry.targetLoadKg)).toEqual([70, 80, 90, 100]);
        expect(backoffSets.map((entry) => entry.targetLoadKg)).toEqual([100, 90, 90]);
    });

    it('rejects malformed workout snapshots without creating a partial session', async () => {
        await expect(repository.startProgramDay({name: 'Invalid', exercises: [
            {exerciseId: 'curl', exerciseName: 'Curl', prescriptionSnapshot: 'invalid', workingSets: 0, repsMin: 8, repsMax: 12, targetLoadKg: 20, targetRir: 2, restSeconds: 60},
        ]}, 'invalid-start')).rejects.toBeInstanceOf(WorkoutDomainError);

        expect(await db.workoutSession.count()).toBe(0);
        expect(await db.workoutOperation.count()).toBe(0);
    });
});
