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
});
