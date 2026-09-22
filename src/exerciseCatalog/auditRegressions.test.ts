import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {ExerciseCatalogRepository} from '../exerciseCatalog/ExerciseCatalogRepository';
import {hasAvailableEquipment} from '../exerciseCatalog/selection';
import {effectiveEquipmentTags, requiredStations} from '../workout/equipmentStations';
import {resolveWorkoutExerciseMedia} from '../pages/workout-active/workoutExerciseMedia';
import {GENERATOR_VERSION as buildVersion} from '../config/buildIdentity';
import {GENERATOR_VERSION as domainVersion} from '../generator/types';

// Isolated fake IndexedDB only. No real browser profile or user data is opened.
let db: DexieDB;
let catalog: ExerciseCatalogRepository;
beforeEach(async () => {
    localStorage.setItem('userName', 'Default User');
    await Dexie.delete('weightlog');
    db = new DexieDB();
    catalog = new ExerciseCatalogRepository(db);
});
afterEach(async () => {
    db.close();
    await Dexie.delete('weightlog');
    localStorage.clear();
});

it('corrected resistance equipment is respected by generation eligibility', async () => {
    const exercise = await catalog.createCustom({name: 'Audit equipment', equipment: 'barbell', primaryMuscle: 'biceps'});
    await catalog.updatePreference(exercise.id, {requiredEquipmentStations: ['cable'], primaryEquipmentStation: 'cable'});
    const corrected = (await catalog.get(exercise.id))!;
    expect(requiredStations(corrected)).toEqual(['cable']);
    expect(hasAvailableEquipment(corrected, ['cable'])).toBe(true);
    expect(hasAvailableEquipment(corrected, ['barbell'])).toBe(false);
});

it('library equipment filter respects a personal correction', async () => {
    const exercise = await catalog.createCustom({name: 'Audit filter', equipment: 'barbell', primaryMuscle: 'biceps'});
    await catalog.updatePreference(exercise.id, {requiredEquipmentStations: ['cable'], primaryEquipmentStation: 'cable'});
    expect((await catalog.list({equipment: 'cable'})).map(entry => entry.id)).toContain(exercise.id);
});

it('the application and domain report the same generator version', () => {
    expect(buildVersion).toBe(domainVersion);
});

it('keeps resistance requirements when only an auxiliary support is corrected', () => {
    expect(effectiveEquipmentTags({equipmentTags: ['dumbbell'], requiredEquipmentStations: ['bench']})).toEqual(['dumbbell']);
    expect(hasAvailableEquipment({equipmentTags: ['barbell'], requiredEquipmentStations: ['bench', 'cable']}, ['cable'])).toBe(true);
    expect(hasAvailableEquipment({equipmentTags: ['barbell'], requiredEquipmentStations: ['dumbbell', 'bands']}, ['dumbbell'])).toBe(false);
    expect(hasAvailableEquipment({equipmentTags: ['barbell'], requiredEquipmentStations: ['bodyweight']}, ['barbell'])).toBe(false);
});

it('a stored custom exercise image is available in workout media', async () => {
    const exercise = await catalog.createCustom({name: 'Audit image', equipment: 'dumbbell', primaryMuscle: 'biceps', image: new Blob(['synthetic-image'], {type: 'image/png'})});
    expect((await db.customExercise.get(exercise.id))?.customImage).toBeDefined();
    expect(await resolveWorkoutExerciseMedia(catalog, exercise.id, exercise.name)).not.toHaveLength(0);
});
