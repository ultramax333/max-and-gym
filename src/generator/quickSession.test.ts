import {describe, expect, it} from 'vitest';
import reviewed from '../exerciseCatalog/reviewed-exercises.json';
import {generateQuickSession} from './quickSession';
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
        expect(result.program.days[0].exercises.every((exercise) => {
            const candidate = candidates.find((entry) => entry.id === exercise.exerciseId);
            return candidate ? [...candidate.primaryMuscles, ...candidate.secondaryMuscles].some((muscle) => ['biceps', 'triceps', 'forearms'].includes(muscle)) : false;
        })).toBe(true);
    });

    it('fails clearly when a zone has fewer than three eligible exercises', () => {
        const result = generateQuickSession(input(45), candidates.filter((candidate) => candidate.primaryMuscles.includes('biceps')), 'arms');
        expect(result).toMatchObject({ok: false, code: 'NO_VALID_CANDIDATE'});
    });
});
