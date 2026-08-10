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
        expect(seed.length).toBeLessThanOrEqual(400);
        expect(seed.every((entry) => entry.contentStatus === 'reviewed' && entry.sourceRevision === 'b0eed061e1c8' && entry.sourceUrl && entry.license === 'Unlicense')).toBe(true);
        expect(seed.every((entry) => entry.media.every((media) => media.path.startsWith('media/exercises/') && !media.path.startsWith('/')))).toBe(true);
        expect(seed.every((entry) => !/(burpee|bunny|rapid.*floor|rapid.*plank)/i.test(entry.name))).toBe(true);
    });

    it('keeps unsuitable or redundant records browsable but out of generation', () => {
        const reviewed = seed as ReviewedExercise[];
        const excludedIds = reviewed.filter((entry) => !entry.generatorEligible).map((entry) => entry.id).sort();
        expect(excludedIds).toEqual([
            '90_90_Hamstring', 'Alternate_Incline_Dumbbell_Curl', 'Anti-Gravity_Press', 'Barbell_Full_Squat',
            'Barbell_Guillotine_Bench_Press', 'Bent_Press', 'Bosu_Ball_Cable_Crunch_With_Side_Bends',
            'Box_Squat_with_Chains', 'Bradford_Rocky_Presses', 'Cable_Iron_Cross',
            'Cable_Rope_Overhead_Triceps_Extension', 'Chair_Leg_Extended_Stretch',
            'Chest_And_Front_Of_Shoulder_Stretch', 'Clean_and_Press', 'Crunch_-_Legs_On_Exercise_Ball',
            'Double_Kettlebell_Push_Press', 'Dumbbell_Alternate_Bicep_Curl', 'Dumbbell_Squat_To_A_Bench',
            'Freehand_Jump_Squat', 'Front_Barbell_Squat_To_A_Bench', 'Front_Leg_Raises',
            'Front_Two-Dumbbell_Raise', 'Hip_Circles_prone', 'Incline_Dumbbell_Flyes_-_With_A_Twist',
            'Intermediate_Hip_Flexor_and_Quad_Stretch', 'Plank', 'Plate_Pinch',
            'Rope_Straight-Arm_Pulldown', 'Side_Bridge',
        ].map((id) => `fedb:${id}`).sort());
    });

    it('classifies core and common compound patterns from muscles and canonical names', () => {
        const reviewed = seed as ReviewedExercise[];
        const byId = (id: string) => reviewed.find((entry) => entry.id === `fedb:${id}`);
        expect(byId('Cable_Crossover')?.movementPattern).toBe('accessory');
        expect(byId('Cable_Hammer_Curls_-_Rope_Attachment')?.movementPattern).toBe('accessory');
        expect(byId('Dead_Bug')?.movementPattern).toBe('core');
        expect(byId('Pallof_Press')?.movementPattern).toBe('core');
        expect(byId('Pullups')?.movementPattern).toBe('pull');
        expect(byId('Barbell_Step_Ups')?.movementPattern).toBe('squat');
    });

    it('returns only the curated active pool when generation requests eligible exercises', async () => {
        const eligible = await repository.list({status: 'eligible'});
        expect(eligible).toHaveLength(271);
        expect(eligible.some((entry) => entry.id === 'fedb:Plank')).toBe(false);
        expect((await repository.list()).some((entry) => entry.id === 'fedb:Plank')).toBe(true);
    });

    it('hides redundant variants without breaking direct historical lookup', async () => {
        const archivedId = 'fedb:Dumbbell_Alternate_Bicep_Curl';
        expect((await repository.list()).some((entry) => entry.id === archivedId)).toBe(false);
        expect(await repository.get(archivedId)).toMatchObject({id: archivedId, archived: true, generatorEligible: false});
    });

    it('preserves local preferences when the seed is ensured again', async () => {
        const all = await repository.list();
        const first = all[0];
        await repository.updatePreference(first.id, {favourite: true, neverSuggest: true});
        await repository.ensureSeed();
        const restored = await repository.get(first.id);
        expect(restored?.favourite).toBe(false);
        expect(restored?.effectiveNeverSuggest).toBe(true);
        expect((await repository.list({status: 'eligible'})).every((entry) => !entry.effectiveNeverSuggest && entry.generatorEligible)).toBe(true);
    });

    it('makes Never Suggest override a favourite preference', async () => {
        const exercise = (await repository.list({status: 'eligible'}))[0];
        await repository.updatePreference(exercise.id, {favourite: true});
        await repository.updatePreference(exercise.id, {neverSuggest: true});
        expect(await repository.get(exercise.id)).toMatchObject({favourite: false, effectiveNeverSuggest: true});
        expect((await repository.list({status: 'eligible'}).then((entries) => entries.map((entry) => entry.id)))).not.toContain(exercise.id);
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
