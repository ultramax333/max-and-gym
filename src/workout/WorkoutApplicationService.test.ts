import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {diagnosticsDb} from '../diagnostics/database';
import {DexieDB} from '../db/db';
import {DexieWorkoutRepository} from './DexieWorkoutRepository';
import {ACTIVE_WORKOUT_STORAGE_KEY, createOperationId, hasActiveWorkoutMarker, WorkoutApplicationService} from './WorkoutApplicationService';

describe('WorkoutApplicationService recovery', () => {
    let db: DexieDB;
    let service: WorkoutApplicationService;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        await diagnosticsDb.operations.clear();
        db = new DexieDB();
        service = new WorkoutApplicationService(new DexieWorkoutRepository(db));
    });

    afterEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('creates unique operation identifiers and exposes the active update marker', async () => {
        expect(createOperationId()).not.toBe(createOperationId());
        expect(hasActiveWorkoutMarker()).toBe(false);
        const snapshot = await service.start('start-marker');
        expect(localStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY)).toBe(snapshot.session.id);
        expect(hasActiveWorkoutMarker()).toBe(true);
        await service.finish(snapshot.session.id, 'finish-marker');
        expect(hasActiveWorkoutMarker()).toBe(false);
    });

    it('repairs a timer whose performed-set owner is invalid', async () => {
        const started = await service.start('start');
        const completed = await service.completeSet({sessionId: started.session.id, setId: started.sets[0].id, actualLoadKg: 16, actualReps: 8}, 'complete');
        await db.restTimer.update(completed.timer!.id, {performedSetId: 'missing-owner'});
        const recovered = await service.recover();
        expect(recovered?.timer).toBeUndefined();
        expect(recovered?.session.currentSetId).toBe(started.sets[1].id);
    });

    it('repairs a completed-set pointer during app recovery', async () => {
        const started = await service.start('start-stale-pointer');
        const completed = await service.completeSet({sessionId: started.session.id, setId: started.sets[0].id, actualLoadKg: 16, actualReps: 8}, 'complete-stale-pointer');
        await db.workoutSession.update(started.session.id, {currentSetId: started.sets[0].id});

        const recovered = await service.recover();

        expect(recovered?.session.currentSetId).toBe(completed.sets[1].id);
        expect(recovered?.sets.filter((entry) => entry.status === 'completed')).toHaveLength(1);
    });

    it('clears the active marker when a workout is replaced', async () => {
        const started = await service.start('start-replaced');
        const replaced = await service.abandon(started.session.id, 'abandon-replaced');
        expect(replaced.session.status).toBe('abandoned');
        expect(hasActiveWorkoutMarker()).toBe(false);
        expect(await service.recover()).toBeUndefined();
    });

    it('completes a full offline journey without any network dependency', async () => {
        window.dispatchEvent(new Event('offline'));
        let snapshot = await service.start('offline-start');
        for (let index = 0; index < snapshot.sets.length; index += 1) {
            const current = snapshot.sets.find((entry) => entry.id === snapshot.session.currentSetId)!;
            snapshot = await service.completeSet({sessionId: snapshot.session.id, setId: current.id, actualLoadKg: current.targetLoadKg, actualReps: current.targetRepsMin}, `offline-set-${index}`);
        }
        snapshot = await service.finish(snapshot.session.id, 'offline-finish');
        expect(snapshot.session.status).toBe('completed');
        expect(snapshot.sets.every((entry) => entry.status === 'completed')).toBe(true);
    });
});
