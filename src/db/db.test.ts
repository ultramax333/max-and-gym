import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, describe, expect, it} from 'vitest';
import {DATABASE_SCHEMAS, DexieDB} from './db';

describe('legacy database compatibility', () => {
    afterEach(async () => {
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it.each([2, 3, 4, 5, 6, 7])('migrates supported version %i additively to schema version 8', async (version) => {
        localStorage.setItem('userName', 'Default User');
        const baseline = new Dexie('weightlog');
        baseline.version(version).stores(DATABASE_SCHEMAS[version]);
        await baseline.open();
        await baseline.table('exercise').put({id: 41, name: 'Anonymous migration fixture', type: 'strength', tags: []});
        baseline.close();

        const db = new DexieDB();
        await db.open();
        expect(db.verno).toBe(8);
        expect(db.tables.map((table) => table.name).sort()).toEqual([
            'exercise', 'exerciseSet', 'plan', 'user', 'userMetric', 'workout',
            'workoutExercise', 'workoutHistory', 'workoutSession', 'sessionExercise',
            'performedSet', 'restTimer', 'workoutOperation', 'exerciseCatalog',
            'exercisePreference', 'customExercise', 'trainingProgram', 'programDay',
            'programExercise', 'exercisePrescription', 'progressionRule', 'progressionProposal',
            'bodyMeasurement', 'mediaBlob', 'progressPhoto', 'appMeta', 'operationJournal', 'safetySnapshot',
        ].sort());
        expect(await db.exercise.get(41)).toMatchObject({name: 'Anonymous migration fixture'});
        db.close();
    });

    it('refuses an unsupported future schema without deleting its records', async () => {
        localStorage.setItem('userName', 'Default User');
        const future = new Dexie('weightlog');
        future.version(9).stores({...DATABASE_SCHEMAS[8], futureMarker: '&id'});
        await future.open();
        await future.table('futureMarker').put({id: 'preserved'});
        future.close();

        const current = new DexieDB();
        await expect(current.open()).rejects.toMatchObject({name: 'VersionError'});
        current.close();

        const reopened = new Dexie('weightlog');
        reopened.version(9).stores({...DATABASE_SCHEMAS[8], futureMarker: '&id'});
        await reopened.open();
        expect(await reopened.table('futureMarker').get('preserved')).toEqual({id: 'preserved'});
        reopened.close();
    });
});
