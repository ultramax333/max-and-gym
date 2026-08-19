import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {ExerciseContextRatingRepository} from './ExerciseContextRatingRepository';

describe('contextual exercise ratings', () => {
    let db: DexieDB;
    let repository: ExerciseContextRatingRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new ExerciseContextRatingRepository(db);
    });

    afterEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('keeps ratings independent by body area and training goal', async () => {
        await repository.set('row', {zone: 'back', goal: 'hypertrophy'}, 5);
        await repository.set('row', {zone: 'glutes', goal: 'hypertrophy'}, 2);
        await repository.set('row', {zone: 'back', goal: 'strength'}, 4);

        expect(await repository.get('row', {zone: 'back', goal: 'hypertrophy'})).toMatchObject({rating: 5});
        expect(await repository.get('row', {zone: 'glutes', goal: 'hypertrophy'})).toMatchObject({rating: 2});
        expect(await repository.get('row', {zone: 'back', goal: 'strength'})).toMatchObject({rating: 4});
        expect(await repository.list({zone: 'back', goal: 'hypertrophy'})).toHaveLength(1);
    });
});
