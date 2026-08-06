import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {DexieWorkoutRepository} from '../workout/DexieWorkoutRepository';
import {ProgramDomainError, ProgramRepository} from './ProgramRepository';
import {SetType} from '../models/workout';
import reviewed from '../exerciseCatalog/reviewed-exercises.json';
import {generateProgram} from '../generator/deterministicGenerator';
import {GENERATOR_VERSION, GeneratorCandidate, PROGRAM_SEED_VERSION} from '../generator/types';

describe('ProgramRepository', () => {
    let db: DexieDB;
    let ids: number;
    let repository: ProgramRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        ids = 0;
        db = new DexieDB();
        repository = new ProgramRepository(db, {now: () => new Date('2026-08-06T12:00:00Z'), id: () => `id-${++ids}`});
    });

    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    const add = async (dayId: string, name = 'Squat') => repository.addExercise({dayId, exerciseId: name.toLowerCase(), exerciseName: name, movementPattern: 'squat', primaryMuscles: ['quadriceps'], defaultRestSeconds: 180, defaultReps: {min: 5, max: 8}});

    it('creates only two or three ordered days and performs CRUD locally', async () => {
        const program = await repository.create({name: 'Force', weeklyFrequency: 2, defaultDurationMinutes: 40});
        expect(program.days.map((day) => day.name)).toEqual(['Jour A', 'Jour B']);
        await expect(repository.create({name: 'Bad', weeklyFrequency: 4 as 2, defaultDurationMinutes: 40})).rejects.toBeInstanceOf(ProgramDomainError);
        const exercise = await add(program.days[0].id);
        await repository.updatePrescription(exercise.prescriptionId, {workingSets: 4, restSeconds: 210});
        expect((await repository.get(program.id))?.days[0].exercises[0].prescription).toMatchObject({workingSets: 4, restSeconds: 210});
        await repository.removeExercise(exercise.id);
        expect((await repository.get(program.id))?.days[0].exercises).toHaveLength(0);
    });

    it('reorders and groups only consecutive exercises', async () => {
        const program = await repository.create({name: 'Groupes', weeklyFrequency: 2, defaultDurationMinutes: 60});
        const [a, b, c] = [await add(program.days[0].id, 'A'), await add(program.days[0].id, 'B'), await add(program.days[0].id, 'C')];
        await repository.moveExercise(c.id, -1);
        expect((await repository.get(program.id))?.days[0].exercises.map((entry) => entry.exerciseNameSnapshot)).toEqual(['A', 'C', 'B']);
        await repository.groupExercises(program.days[0].id, [a.id, c.id], 'superset');
        const grouped = (await repository.get(program.id))!.days[0].exercises.slice(0, 2);
        expect(grouped[0].groupId).toBe(grouped[1].groupId);
        await expect(repository.groupExercises(program.days[0].id, [a.id, b.id], 'superset')).rejects.toMatchObject({code: 'PROGRAM_INVALID_GROUP'});
    });

    it('activates one complete program, duplicates it and preserves archive history', async () => {
        const first = await repository.create({name: 'Premier', weeklyFrequency: 2, defaultDurationMinutes: 40});
        await add(first.days[0].id); await add(first.days[1].id);
        await repository.activate(first.id);
        const copy = await repository.duplicate(first.id);
        await repository.activate(copy.id);
        expect((await repository.get(first.id))?.status).toBe('draft');
        expect((await repository.active())?.id).toBe(copy.id);
        await repository.archive(copy.id);
        expect((await repository.get(copy.id))?.status).toBe('archived');
        expect((await repository.get(first.id))?.days[0].exercises).toHaveLength(1);
    });

    it('starts an immutable workout snapshot that later program edits cannot rewrite', async () => {
        const program = await repository.create({name: 'Snapshot', weeklyFrequency: 2, defaultDurationMinutes: 40});
        const exercise = await add(program.days[0].id);
        await repository.updateExercise(exercise.id, {locked: true, alternativeExerciseIds: ['alt-a']});
        const workout = new DexieWorkoutRepository(db, {now: () => new Date('2026-08-06T12:00:00Z'), id: () => `workout-${++ids}`});
        const session = await workout.startProgramDay({name: program.days[0].name, programId: program.id, programDayId: program.days[0].id, exercises: [{exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseNameSnapshot, prescriptionSnapshot: '3 × 5–8 · repos 180 s', workingSets: 3, repsMin: 5, repsMax: 8, targetLoadKg: 0, targetRir: 2, restSeconds: 180, locked: true, alternativeExerciseIds: ['alt-a']}]}, 'start');
        await repository.updatePrescription(exercise.prescriptionId, {workingSets: 5, restSeconds: 60});
        await repository.updateExercise(exercise.id, {locked: false, alternativeExerciseIds: ['alt-b']});
        expect((await workout.get(session.session.id))?.sets).toHaveLength(3);
        expect((await workout.get(session.session.id))?.exercises[0].prescriptionSnapshot).toContain('180 s');
        expect((await workout.get(session.session.id))?.exercises[0]).toMatchObject({lockedSnapshot: true, alternativeExerciseIdsSnapshot: ['alt-a']});
    });

    it('imports a two-day legacy plan once without deleting its source history', async () => {
        await db.exercise.add({id: 30, name: 'Legacy press', tags: []});
        await db.exerciseSet.bulkAdd([{id: 40, exerciseId: 30, type: SetType.STANDARD, reps: 6, rest: 120, initial: true}, {id: 41, exerciseId: 30, type: SetType.STANDARD, reps: 6, rest: 120, initial: true}]);
        await db.workoutExercise.bulkAdd([{id: 20, exerciseId: 30, setIds: [40, 41], initial: true}, {id: 21, exerciseId: 30, setIds: [40, 41], initial: true}]);
        await db.workout.bulkAdd([{id: 10, name: 'Legacy A', daysOfWeek: [], workoutExerciseIds: [20]}, {id: 11, name: 'Legacy B', daysOfWeek: [], workoutExerciseIds: [21]}]);
        await db.plan.add({id: 1, name: 'Legacy plan', workoutIds: [10, 11]});
        expect(await repository.importLegacyPlans()).toBe(1);
        expect(await repository.importLegacyPlans()).toBe(0);
        const imported = (await repository.list())[0];
        expect((await repository.get(imported.id))?.days.map((day) => [day.name, day.exercises[0].exerciseNameSnapshot, day.exercises[0].prescription.workingSets])).toEqual([['Legacy A', 'Legacy press', 2], ['Legacy B', 'Legacy press', 2]]);
        expect(await db.plan.count()).toBe(1);
    });

    it('creates pending progression proposals on finish without mutating prescriptions', async () => {
        const program = await repository.create({name: 'Progression', weeklyFrequency: 2, defaultDurationMinutes: 40});
        const exercise = await add(program.days[0].id);
        const workout = new DexieWorkoutRepository(db, {now: () => new Date('2026-08-06T12:00:00Z'), id: () => `workout-${++ids}`});
        const session = await workout.startProgramDay({name: 'Jour A', programId: program.id, programDayId: program.days[0].id, exercises: [{programExerciseId: exercise.id, exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseNameSnapshot, prescriptionSnapshot: '3 × 5–8', workingSets: 3, repsMin: 5, repsMax: 8, targetLoadKg: 100, targetRir: 2, restSeconds: 180}]}, 'start-progress');
        for (const [index, set] of session.sets.entries()) await workout.completeSet({sessionId: session.session.id, setId: set.id, operationId: `complete-${index}`, actualLoadKg: 100, actualReps: 8, actualRir: 2});
        await workout.finish(session.session.id, 'finish-progress');
        expect(await db.progressionProposal.where('sessionId').equals(session.session.id).count()).toBe(1);
        expect((await db.progressionProposal.where('sessionId').equals(session.session.id).first())?.status).toBe('pending');
        expect((await db.exercisePrescription.get(exercise.prescriptionId))?.loadReferenceKg).toBe(0);
    });

    it('persists a generated explanation, versions and explicit day content as a draft', async () => {
        const generated = generateProgram({frequency: 2, durationMinutes: 40, goal: 'balanced', equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'], priorityMuscles: [], variation: 'moderate', blockedExerciseIds: [], blockedTags: [], favouriteExerciseIds: [], neverSuggestExerciseIds: [], stableExercises: [], coreMinutes: 10, lowBackComfortWarmup: true, seed: 'persist', generatorVersion: GENERATOR_VERSION, exerciseSeedVersion: 'reviewed-1', programSeedVersion: PROGRAM_SEED_VERSION}, reviewed as GeneratorCandidate[]);
        expect(generated.ok).toBe(true);
        if (!generated.ok) return;
        const saved = await repository.createGenerated(generated.program);
        expect(saved).toMatchObject({source: 'generator', status: 'draft', generatorVersion: GENERATOR_VERSION, generatorSeed: 'persist'});
        expect(saved.days).toHaveLength(2);
        expect(saved.days.every((day) => day.exercises.length >= 3)).toBe(true);
        expect(JSON.parse(saved.generatorExplanationSnapshot ?? '{}').normalizedInput.seed).toBe('persist');
    });

    it('replaces only unlocked accessories during persisted regeneration', async () => {
        const generated = generateProgram({frequency: 2, durationMinutes: 60, goal: 'balanced', equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'], priorityMuscles: [], variation: 'moderate', blockedExerciseIds: [], blockedTags: [], favouriteExerciseIds: [], neverSuggestExerciseIds: [], stableExercises: [], coreMinutes: 10, lowBackComfortWarmup: true, seed: 'regenerate', generatorVersion: GENERATOR_VERSION, exerciseSeedVersion: 'reviewed-1', programSeedVersion: PROGRAM_SEED_VERSION}, reviewed as GeneratorCandidate[]);
        expect(generated.ok).toBe(true);
        if (!generated.ok) return;
        const saved = await repository.createGenerated(generated.program);
        const before = saved.days.flatMap((day) => day.exercises);
        const unlockedAccessory = before.find((entry) => entry.generatorRoleSnapshot === 'accessory' && !entry.locked);
        expect(unlockedAccessory).toBeDefined();
        if (!unlockedAccessory) return;
        const lockedMain = before.find((entry) => entry.generatorRoleSnapshot !== 'accessory');
        expect(lockedMain).toBeDefined();
        if (!lockedMain) return;

        const next = structuredClone(generated.program);
        const nextAccessory = next.days.flatMap((day) => day.exercises).find((entry) => entry.exerciseId === unlockedAccessory.exerciseId);
        expect(nextAccessory).toBeDefined();
        if (!nextAccessory) return;
        next.seed = 'regenerate:accessories';
        nextAccessory.exerciseId = 'replacement-accessory';
        nextAccessory.exerciseName = 'Replacement accessory';
        nextAccessory.prescription.loadReferenceKg = 12;
        await repository.applyRegeneratedAccessories(saved.id, next);

        const after = (await repository.get(saved.id))!;
        const persistedAccessory = after.days.flatMap((day) => day.exercises).find((entry) => entry.id === unlockedAccessory.id);
        const persistedMain = after.days.flatMap((day) => day.exercises).find((entry) => entry.id === lockedMain.id);
        expect(persistedAccessory).toMatchObject({exerciseId: 'replacement-accessory', exerciseNameSnapshot: 'Replacement accessory'});
        expect(persistedAccessory?.prescription.loadReferenceKg).toBe(12);
        expect(persistedMain).toMatchObject({exerciseId: lockedMain.exerciseId, prescription: lockedMain.prescription});
        expect(after.generatorSeed).toBe('regenerate:accessories');
    });
});
