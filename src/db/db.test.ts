import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, describe, expect, it} from 'vitest';
import {DexieDB} from './db';

describe('legacy database compatibility', () => {
    afterEach(async () => {
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('migrates an existing version 3 database additively to progression schema version 7', async () => {
        localStorage.setItem('userName', 'Default User');
        const baseline = new Dexie('weightlog');
        baseline.version(3).stores({
            exercise: '++id, name, type, *tags', workout: '++id, name', workoutHistory: '++id, userName, date, workoutExerciseIds',
            workoutExercise: '++id, exerciseId, setIds', exerciseSet: '++id, exerciseId, type', user: '++name',
            userMetric: '++id, metric', plan: '++id, workoutId, name',
        });
        await baseline.open();
        baseline.close();

        const db = new DexieDB();
        await db.open();
        expect(db.verno).toBe(7);
        expect(db.tables.map((table) => table.name).sort()).toEqual([
            'exercise', 'exerciseSet', 'plan', 'user', 'userMetric', 'workout',
            'workoutExercise', 'workoutHistory', 'workoutSession', 'sessionExercise',
            'performedSet', 'restTimer', 'workoutOperation', 'exerciseCatalog',
            'exercisePreference', 'customExercise', 'trainingProgram', 'programDay',
            'programExercise', 'exercisePrescription', 'progressionRule', 'progressionProposal',
        ].sort());
        db.close();
    });
});
