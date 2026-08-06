import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import seed from './reviewed-exercises.json';
import {DexieDB} from '../db/db';
import {ExerciseCatalogRepository} from './ExerciseCatalogRepository';

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

    it('persists one bounded custom image locally', async () => {
        const image = new Blob(['image-data'], {type: 'image/png'});
        const created = await repository.createCustom({name: 'Cable press test', equipment: 'cable', primaryMuscle: 'chest', image});
        const read = await repository.get(created.id);
        expect(read?.source).toBe('maxgym');
        expect(await db.customExercise.get(created.id)).toMatchObject({name: 'Cable press test', customImageMimeType: 'image/png'});
    });
});
