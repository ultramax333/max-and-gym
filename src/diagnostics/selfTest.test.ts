import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {runSelfTest} from './selfTest';

describe('complete non-destructive self-test', () => {
    let db: DexieDB;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); db = new DexieDB(); await db.open(); });
    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    it('reports healthy database invariants without creating personal records', async () => {
        const before = await db.workoutSession.count();
        const result = await runSelfTest(db);
        expect(result.checks.find((entry) => entry.id === 'database-schema')?.level).toBe('pass');
        expect(result.checks.find((entry) => entry.id === 'backup-dry-run')?.level).toBe('pass');
        expect(result.checks.find((entry) => entry.id === 'referential-integrity')?.level).toBe('pass');
        expect(await db.workoutSession.count()).toBe(before);
    });

    it('isolates referential and active-session failures in fixtures', async () => {
        const base = {creationOperationId: 'operation', nameSnapshot: 'private', status: 'active' as const, startedAt: '2026-08-06T00:00:00Z', pausedDurationSeconds: 0, currentSessionExerciseId: 'missing', currentSetId: 'missing', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'};
        await db.workoutSession.bulkAdd([{...base, id: 'active-a'}, {...base, id: 'active-b', creationOperationId: 'operation-b'}]);
        await db.performedSet.add({id: 'orphan', sessionId: 'active-a', sessionExerciseId: 'missing', sequenceIndex: 0, status: 'planned', targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: 0, targetRir: 0, restSeconds: 0, createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.performedSet.bulkAdd([{id: 'duplicate-a', sessionId: 'active-a', sessionExerciseId: 'missing', sequenceIndex: 1, status: 'completed', targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: 0, targetRir: 0, restSeconds: 0, completionOperationId: 'duplicate-completion', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'}, {id: 'duplicate-b', sessionId: 'active-b', sessionExerciseId: 'missing', sequenceIndex: 1, status: 'completed', targetRepsMin: 1, targetRepsMax: 1, targetLoadKg: 0, targetRir: 0, restSeconds: 0, completionOperationId: 'duplicate-completion', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'}]);
        await db.restTimer.add({id: 'invalid-timer', sessionId: 'missing-session', performedSetId: 'orphan', startedAt: '2026-08-06T00:00:00Z', endsAt: '2026-08-06T00:01:00Z', status: 'running', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.progressPhoto.add({id: 'orphan-photo', recordedAt: '2026-08-06', pose: 'front', imageBlobId: 'missing-image', thumbnailBlobId: 'missing-thumb', note: 'private', blurThumbnail: false, originalByteSize: 1, storedByteSize: 1, createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        const result = await runSelfTest(db);
        expect(result.checks.find((entry) => entry.id === 'active-session-count')?.level).toBe('fail');
        expect(result.checks.find((entry) => entry.id === 'referential-integrity')?.level).toBe('fail');
        expect(result.checks.find((entry) => entry.id === 'operation-identifiers')?.level).toBe('fail');
        expect(result.checks.find((entry) => entry.id === 'timer-ownership')?.level).toBe('fail');
        expect(result.checks.find((entry) => entry.id === 'photo-references')?.level).toBe('fail');
    });
});
