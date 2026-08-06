import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {ProgressionProposalRepository} from './ProgressionProposalRepository';

describe('ProgressionProposalRepository', () => {
    let db: DexieDB;
    let repository: ProgressionProposalRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new ProgressionProposalRepository(db, () => new Date('2026-08-07T12:00:00Z'));
        await db.exercisePrescription.add({id: 'rx', workingSets: 3, repsMin: 6, repsMax: 8, targetRir: 2, restSeconds: 120, loadReferenceKg: 100});
    });

    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    const add = (id: string) => db.progressionProposal.add({id, sessionId: 'session', programId: 'program', programExerciseId: 'exercise', prescriptionId: 'rx', exerciseId: 'squat', kind: 'double-progression', status: 'pending', proposedLoadKg: 102.5, reasonCode: 'SUCCESS_INCREASE', reason: 'Test', requiresConfirmation: true, createdAt: '2026-08-07T10:00:00Z', updatedAt: '2026-08-07T10:00:00Z'});

    it('does not mutate on reject or postpone', async () => {
        await add('reject'); await repository.reject('reject');
        await add('postpone'); await repository.postpone('postpone');
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(100);
        expect((await repository.list()).map((entry) => entry.status).sort()).toEqual(['postponed', 'rejected']);
    });

    it('applies only an accepted or explicitly edited value', async () => {
        await add('accept');
        await repository.accept('accept');
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(102.5);
        await db.exercisePrescription.update('rx', {loadReferenceKg: 100});
        await add('edit');
        expect(await repository.accept('edit', 101.25)).toMatchObject({status: 'edited', proposedLoadKg: 101.25});
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(101.25);
    });
});
