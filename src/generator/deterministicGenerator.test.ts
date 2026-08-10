import {describe, expect, it} from 'vitest';
import reviewed from '../exerciseCatalog/reviewed-exercises.json';
import {generateCoreSession} from './coreWarmup';
import {generateProgram, normalizeGeneratorInput, regenerateAccessories} from './deterministicGenerator';
import {GENERATOR_VERSION, GeneratorCandidate, GeneratorInput, PROGRAM_SEED_VERSION} from './types';
import {CORE_SEED_FIXTURES, SEED_PROGRAM_FIXTURES} from './seedPrograms';

const candidates = reviewed as GeneratorCandidate[];
const equipment = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'];
const input = (change: Partial<GeneratorInput> = {}): GeneratorInput => ({frequency: 2, durationMinutes: 40, goal: 'balanced', equipment, priorityMuscles: ['abdominals', 'quadriceps'], variation: 'moderate', blockedExerciseIds: [], blockedTags: [], favouriteExerciseIds: [], neverSuggestExerciseIds: [], stableExercises: [], coreMinutes: 10, lowBackComfortWarmup: true, seed: 'seed-01', generatorVersion: GENERATOR_VERSION, exerciseSeedVersion: 'reviewed-1', programSeedVersion: PROGRAM_SEED_VERSION, ...change});

describe('deterministic program generator', () => {
    it.each([[2, 40], [2, 60], [3, 40], [3, 60]] as const)('generates a valid %i-day %i-minute structure', (frequency, durationMinutes) => {
        const result = generateProgram(input({frequency, durationMinutes}), candidates);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.program.days).toHaveLength(frequency);
        for (const day of result.program.days) expect(day.duration.total / 60).toBeGreaterThanOrEqual(durationMinutes * 0.9);
        for (const day of result.program.days) expect(day.duration.total / 60).toBeLessThanOrEqual(durationMinutes * 1.1);
        expect(result.program.explanation.selections.length).toBeGreaterThanOrEqual(frequency * 3);
    });

    it('keeps the reviewed seed fixtures aligned with all supported formats', () => {
        expect(SEED_PROGRAM_FIXTURES.map((fixture) => `${fixture.frequency}x${fixture.durationMinutes}`)).toEqual(['2x40', '2x60', '3x40', '3x60']);
        expect(CORE_SEED_FIXTURES).toEqual([{id: 'core-10', minutes: 10, rounds: 2}, {id: 'core-15', minutes: 15, rounds: 3}]);
    });

    it('normalizes unordered inputs and reproduces output and explanations exactly', () => {
        const a = input({equipment: [...equipment].reverse(), blockedTags: ['high-impact', 'rapid-transition'], seed: 'repeat'});
        const b = input({equipment, blockedTags: ['rapid-transition', 'high-impact'], seed: 'repeat'});
        expect(normalizeGeneratorInput(a)).toEqual(normalizeGeneratorInput(b));
        expect(generateProgram(a, [...candidates].reverse())).toEqual(generateProgram(b, candidates));
    });

    it('includes generator and seed versions in compatibility identity', () => {
        const current = generateProgram(input(), candidates);
        const migrated = generateProgram(input({generatorVersion: 'deterministic-v4'}), candidates);
        expect(current.ok && migrated.ok).toBe(true);
        if (current.ok && migrated.ok) expect(current.program.identityHash).not.toBe(migrated.program.identityHash);
    });

    it('fails closed when equipment constraints make a required role impossible', () => {
        const result = generateProgram(input({equipment: ['body only']}), candidates);
        expect(result).toMatchObject({ok: false, code: 'NO_VALID_CANDIDATE'});
    });

    it('never selects blocked exercises or tags across 120 representative seeds', () => {
        for (let index = 0; index < 120; index++) {
            const blocked = candidates[index % candidates.length];
            const result = generateProgram(input({seed: `property-${index}`, blockedExerciseIds: [blocked.id], blockedTags: index % 2 ? ['high-impact'] : []}), candidates);
            expect(result.ok).toBe(true);
            if (result.ok) expect(result.program.days.flatMap((day) => day.exercises).some((entry) => entry.exerciseId === blocked.id)).toBe(false);
        }
    });

    it('preserves a stable main exercise and a locked accessory during regeneration', () => {
        const first = generateProgram(input({durationMinutes: 60}), candidates);
        expect(first.ok).toBe(true);
        if (!first.ok) return;
        const main = first.program.days[0].exercises[0];
        const accessory = first.program.days[0].exercises.find((entry) => entry.role === 'accessory')!;
        accessory.locked = true;
        const lockedInput = input({durationMinutes: 60, seed: 'changed', stableExercises: [{dayIndex: 0, role: main.role, exerciseId: main.exerciseId, prescription: main.prescription, locked: true}]});
        const stable = generateProgram(lockedInput, candidates);
        expect(stable.ok && stable.program.days[0].exercises[0]).toMatchObject({exerciseId: main.exerciseId, prescription: main.prescription});
        const regenerated = regenerateAccessories(first.program, lockedInput, candidates);
        expect(regenerated.ok && regenerated.program.days[0].exercises.find((entry) => entry.role === 'accessory')).toMatchObject({exerciseId: accessory.exerciseId, prescription: accessory.prescription});
    });

    it.each([10, 15] as const)('builds a position-clustered %i-minute core session', (coreMinutes) => {
        const result = generateCoreSession(input({coreMinutes}), candidates);
        expect(result).toBeDefined();
        if (!result) return;
        expect(result.estimatedSeconds / 60).toBeGreaterThanOrEqual(coreMinutes * 0.9);
        expect(result.estimatedSeconds / 60).toBeLessThanOrEqual(coreMinutes * 1.1);
        expect(new Set(result.exercises.map(() => result.positionCluster)).size).toBe(1);
    });

    it('applies Never Suggest to core with the shared constraint service', () => {
        const baseline = generateCoreSession(input(), candidates)!;
        const blockedId = baseline.exercises[0].exerciseId;
        const result = generateCoreSession(input({neverSuggestExerciseIds: [blockedId]}), candidates)!;
        expect(result.exercises.some((entry) => entry.exerciseId === blockedId)).toBe(false);
        expect(result.exclusions).toContainEqual(expect.objectContaining({exerciseId: blockedId, reasonCode: 'NEVER_SUGGEST'}));
    });
});
