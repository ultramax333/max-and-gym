import {describe, expect, it} from 'vitest';
import reviewed from '../exerciseCatalog/reviewed-exercises.json';
import {generateQuickSession, quickSessionReplacementCandidates} from './quickSession';
import {GENERATOR_VERSION, GeneratorCandidate, GeneratorInput, PROGRAM_SEED_VERSION} from './types';

const candidates = reviewed as GeneratorCandidate[];
const input = (durationMinutes: GeneratorInput['durationMinutes']): GeneratorInput => ({
    frequency: 1,
    durationMinutes,
    goal: 'hypertrophy',
    equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'],
    priorityMuscles: [],
    variation: 'moderate',
    blockedExerciseIds: [],
    blockedTags: [],
    favouriteExerciseIds: [],
    neverSuggestExerciseIds: [],
    stableExercises: [],
    coreMinutes: 10,
    lowBackComfortWarmup: true,
    seed: 'quick-session-test',
    generatorVersion: GENERATOR_VERSION,
    exerciseSeedVersion: 'reviewed-1',
    programSeedVersion: PROGRAM_SEED_VERSION,
});

describe('quick session generator', () => {
    it.each([15, 45, 60] as const)('generates an arms session in %i minutes', (duration) => {
        const result = generateQuickSession(input(duration), candidates, 'arms');
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.program.frequency).toBe(1);
        expect(result.program.durationMinutes).toBe(duration);
        expect(result.program.days).toHaveLength(1);
        expect(result.program.days[0].exercises.length).toBeGreaterThanOrEqual(3);
        expect(result.program.days[0].exercises.every((exercise) => exercise.primaryMuscles.some((muscle) => ['biceps', 'triceps', 'forearms'].includes(muscle)))).toBe(true);
        expect(result.program.days[0].exercises.map((exercise) => exercise.exerciseName)).not.toContain('Barbell Lunge');
        expect(result.program.days[0].exercises.map((exercise) => exercise.exerciseName)).not.toContain('Barbell Bench Press - Medium Grip');
    });

    it('fails clearly when a zone has fewer than three eligible exercises', () => {
        const result = generateQuickSession(input(45), candidates.filter((candidate) => candidate.primaryMuscles.includes('biceps')), 'arms');
        expect(result).toMatchObject({ok: false, code: 'NO_VALID_CANDIDATE'});
    });

    it('never offers a leg exercise as an arms-session replacement', () => {
        const current = {
            exerciseId: 'current',
            movementPattern: 'accessory',
            primaryMuscles: ['biceps'],
            alternativeExerciseIds: ['fedb:Barbell_Lunge'],
        };
        const options = quickSessionReplacementCandidates(candidates, 'arms', input(45).equipment, new Set(['current']), current);
        expect(options.length).toBeGreaterThan(0);
        expect(options.every((exercise) => exercise.primaryMuscles.some((muscle) => ['biceps', 'triceps', 'forearms'].includes(muscle)))).toBe(true);
        expect(options.map((exercise) => exercise.name)).not.toContain('Barbell Lunge');
    });
});
