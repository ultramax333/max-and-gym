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

    it('shows only suggestions from the requested completed session', async () => {
        await add('this-session');
        await db.progressionProposal.add({id: 'another-session', sessionId: 'other', programId: 'program', programExerciseId: 'exercise', prescriptionId: 'rx', exerciseId: 'squat', kind: 'double-progression', status: 'pending', proposedLoadKg: 102.5, reasonCode: 'SUCCESS_INCREASE', reason: 'Test', requiresConfirmation: true, createdAt: '2026-08-07T10:00:00Z', updatedAt: '2026-08-07T10:00:00Z'});
        expect((await repository.listForSession('session')).map((item) => item.id)).toEqual(['this-session']);
    });

    it('joins the readable exercise and logged sets without changing workout history', async () => {
        await add('detail');
        await db.programExercise.add({id: 'exercise', programDayId: 'day', exerciseId: 'squat', exerciseNameSnapshot: 'Back squat', movementPatternSnapshot: 'squat', primaryMusclesSnapshot: ['quadriceps'], sequenceIndex: 0, role: 'primary', groupType: 'single', groupSequenceIndex: 0, locked: false, alternativeExerciseIds: [], prescriptionId: 'rx', progressionRuleId: 'rule', notes: ''});
        await db.sessionExercise.add({id: 'session-exercise', sessionId: 'session', exerciseId: 'squat', exerciseNameSnapshot: 'Back squat', prescriptionSnapshot: '{}', programExerciseId: 'exercise', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 0, status: 'completed', createdAt: '2026-08-07T10:00:00Z', updatedAt: '2026-08-07T10:00:00Z'});
        const template = {sessionId: 'session', sessionExerciseId: 'session-exercise', setKind: 'working' as const, targetRepsMin: 6, targetRepsMax: 8, targetLoadKg: 100, targetRir: 2, restSeconds: 120, createdAt: '2026-08-07T10:00:00Z', updatedAt: '2026-08-07T10:00:00Z'};
        await db.performedSet.bulkAdd([{...template, id: 'set-1', sequenceIndex: 0, status: 'completed', actualLoadKg: 100, actualReps: 8}, {...template, id: 'set-2', sequenceIndex: 1, status: 'planned'}]);
        expect(await repository.detail('detail')).toMatchObject({exerciseName: 'Back squat', savedTargetKg: 100, targetRepsMax: 8, completedSets: 1, totalSets: 2, lastCompleted: {loadKg: 100, repetitions: 8}});
        expect((await db.performedSet.get('set-1'))?.actualReps).toBe(8);
    });

    it('lets a postponed decision be dismissed without altering its saved load', async () => {
        await add('later');
        await repository.postpone('later');
        expect((await repository.reject('later')).status).toBe('rejected');
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(100);
    });

    it('rejects an invalid edited load before any program mutation', async () => {
        await add('invalid-load');
        await expect(repository.accept('invalid-load', Number.NaN)).rejects.toThrow(/finite/);
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(100);
        expect((await db.progressionProposal.get('invalid-load'))?.status).toBe('pending');
    });
});
