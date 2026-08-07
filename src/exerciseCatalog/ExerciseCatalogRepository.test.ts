import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import seed from './reviewed-exercises.json';
import {EXERCISE_SEED_VERSION} from '../config/buildIdentity';
import {DexieDB} from '../db/db';
import {ExerciseCatalogRepository} from './ExerciseCatalogRepository';
import {ReviewedExercise} from './types';

describe('reviewed local exercise catalogue', () => {
    let db: DexieDB;
    let repository: ExerciseCatalogRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new ExerciseCatalogRepository(db);
    });

    afterEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('ships a reviewed, attributed and locally-addressed seed', () => {
        expect(seed.length).toBeGreaterThanOrEqual(150);
        expect(seed.length).toBeLessThanOrEqual(220);
        expect(seed.every((entry) => entry.contentStatus === 'reviewed' && entry.sourceRevision === 'b0eed061e1c8' && entry.sourceUrl && entry.license === 'Unlicense')).toBe(true);
        expect(seed.every((entry) => entry.media.every((media) => media.path.startsWith('media/exercises/') && !media.path.startsWith('/')))).toBe(true);
        expect(seed.every((entry) => !/(burpee|bunny|rapid.*floor|rapid.*plank)/i.test(entry.name))).toBe(true);
    });

    it('preserves local preferences when the seed is ensured again', async () => {
        const all = await repository.list();
        const first = all[0];
        await repository.updatePreference(first.id, {favourite: true, neverSuggest: true});
        await repository.ensureSeed();
        const restored = await repository.get(first.id);
        expect(restored?.favourite).toBe(true);
        expect(restored?.effectiveNeverSuggest).toBe(true);
        expect((await repository.list({status: 'eligible'})).every((entry) => !entry.effectiveNeverSuggest && entry.generatorEligible)).toBe(true);
    });

    it('refreshes stale reviewed records with local media without changing preferences', async () => {
        const gobletSquat = (seed as ReviewedExercise[]).find((entry) => entry.id === 'fedb:Goblet_Squat');
        expect(gobletSquat).toBeDefined();
        await db.exerciseCatalog.put({...gobletSquat!, media: []});
        await db.exercisePreference.put({exerciseId: gobletSquat!.id, favourite: true, neverSuggest: false, updatedAt: '2026-01-01T00:00:00.000Z'});
        await db.appMeta.put({key: 'exerciseCatalogSeedVersion', value: 'fedb-b0eed061e1c8-reviewed-1', updatedAt: '2026-01-01T00:00:00.000Z'});

        const refreshed = await repository.get(gobletSquat!.id);

        expect(refreshed?.media.map((item) => item.kind)).toEqual(['start-image', 'end-image', 'thumbnail']);
        expect(refreshed?.media.every((item) => item.path.startsWith('media/exercises/'))).toBe(true);
        expect(refreshed?.favourite).toBe(true);
        expect(await db.appMeta.get('exerciseCatalogSeedVersion')).toMatchObject({value: EXERCISE_SEED_VERSION});
    });

    it('persists one bounded custom image locally', async () => {
        const image = new Blob(['image-data'], {type: 'image/png'});
        const created = await repository.createCustom({name: 'Cable press test', equipment: 'cable', primaryMuscle: 'chest', image});
        const read = await repository.get(created.id);
        expect(read?.source).toBe('maxgym');
        expect(await db.customExercise.get(created.id)).toMatchObject({name: 'Cable press test', customImageMimeType: 'image/png'});
    });
});
