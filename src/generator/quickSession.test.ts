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
    it.each([15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const)('generates a duration-coherent arms session in %i minutes', (duration) => {
        const result = generateQuickSession(input(duration), candidates, 'arms');
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.program.frequency).toBe(1);
        expect(result.program.durationMinutes).toBe(duration);
        expect(result.program.days).toHaveLength(1);
        const day = result.program.days[0];
        expect(day.duration.total).toBeGreaterThanOrEqual(duration * 60 * 0.9);
        expect(day.duration.total).toBeLessThanOrEqual(duration * 60 * 1.1);
        expect(day.warmup).toEqual([]);
        expect(day.conditioning.seconds).toBe(0);
        expect(day.duration.warmup).toBe(0);
        expect(day.duration.rest).toBeGreaterThan(0);
        if (duration === 50) expect(result.program.days[0].exercises.length).toBeGreaterThan(3);
        expect(result.program.days[0].exercises.every((exercise) => exercise.primaryMuscles.some((muscle) => ['biceps', 'triceps', 'forearms'].includes(muscle)))).toBe(true);
        expect(result.program.days[0].exercises.some((exercise) => exercise.primaryMuscles.includes('biceps'))).toBe(true);
        expect(result.program.days[0].exercises.some((exercise) => exercise.primaryMuscles.includes('triceps'))).toBe(true);
        expect(result.program.days[0].exercises.map((exercise) => exercise.exerciseName)).not.toContain('Barbell Lunge');
        expect(result.program.days[0].exercises.map((exercise) => exercise.exerciseName)).not.toContain('Barbell Bench Press - Medium Grip');
    });

    it('fails clearly when a zone has fewer than three eligible exercises', () => {
        const result = generateQuickSession(input(45), candidates.filter((candidate) => candidate.primaryMuscles.includes('biceps')).slice(0, 2), 'arms');
        expect(result).toMatchObject({ok: false, code: 'NO_VALID_CANDIDATE'});
    });

    it('keeps one variation reproducible while a different variation changes the session', () => {
        const first = generateQuickSession({...input(50), seed: 'session:variation-1'}, candidates, 'arms');
        const repeated = generateQuickSession({...input(50), seed: 'session:variation-1'}, candidates, 'arms');
        const next = generateQuickSession({...input(50), seed: 'session:variation-2'}, candidates, 'arms');
        expect(first).toEqual(repeated);
        expect(first.ok && next.ok).toBe(true);
        if (first.ok && next.ok) {
            expect(first.program.identityHash).not.toBe(next.program.identityHash);
            expect(first.program.days[0].exercises.map((exercise) => exercise.exerciseId)).not.toEqual(next.program.days[0].exercises.map((exercise) => exercise.exerciseId));
        }
    });

    it('includes the chosen global recovery when sizing the session', () => {
        const shortRest = generateQuickSession({...input(50), sessionRestSeconds: 60}, candidates, 'arms');
        const longRest = generateQuickSession({...input(50), sessionRestSeconds: 180}, candidates, 'arms');
        expect(shortRest.ok && longRest.ok).toBe(true);
        if (shortRest.ok && longRest.ok) {
            expect(longRest.program.days[0].exercises.length).toBeLessThan(shortRest.program.days[0].exercises.length);
            expect(longRest.program.days[0].exercises.every((exercise) => exercise.prescription.restSeconds === 180)).toBe(true);
            expect(longRest.program.sessionRestSeconds).toBe(180);
        }
    });

    it('rotates away from the previous session when the eligible pool is large enough', () => {
        const first = generateQuickSession({...input(45), seed: 'rotation-1'}, candidates, 'arms');
        expect(first.ok).toBe(true);
        if (!first.ok) return;
        const previousIds = first.program.days[0].exercises.map((exercise) => exercise.exerciseId);
        const next = generateQuickSession({...input(45), seed: 'rotation-2', blockedExerciseIds: previousIds}, candidates, 'arms');
        expect(next.ok).toBe(true);
        if (next.ok) expect(next.program.days[0].exercises.map((exercise) => exercise.exerciseId).filter((id) => previousIds.includes(id))).toEqual([]);
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

    it('excludes exercises marked Never Suggest from generation and replacements', () => {
        const blocked = candidates.find((entry) => entry.primaryMuscles.includes('biceps'))!;
        const marked = candidates.map((entry) => entry.id === blocked.id ? {...entry, effectiveNeverSuggest: true} : entry);
        const generated = generateQuickSession(input(45), marked, 'arms');
        expect(generated.ok).toBe(true);
        if (generated.ok) expect(generated.program.days[0].exercises.map((entry) => entry.exerciseId)).not.toContain(blocked.id);
        const options = quickSessionReplacementCandidates(marked, 'arms', input(45).equipment, new Set(), {exerciseId: 'current', movementPattern: 'accessory', primaryMuscles: ['biceps'], alternativeExerciseIds: [blocked.id]});
        expect(options.map((entry) => entry.id)).not.toContain(blocked.id);
    });
});
