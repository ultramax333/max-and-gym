import {evaluateHardConstraints} from './constraints';
import {normalizeGeneratorInput, stableHash} from './deterministicGenerator';
import {CandidateExclusion, CandidateSelection, GeneratedExercise, GeneratedProgram, GenerationResult, GeneratorCandidate, GeneratorInput, GeneratorRole} from './types';
import {ProgramDurationMinutes} from '../programs/types';

export type QuickSessionZone = 'full-body' | 'upper-body' | 'lower-body' | 'chest' | 'back' | 'shoulders' | 'arms' | 'glutes' | 'core';

export const QUICK_SESSION_ZONES: Array<{value: QuickSessionZone; label: string; muscles: string[]}> = [
    {value: 'full-body', label: 'Full body', muscles: []},
    {value: 'upper-body', label: 'Upper body', muscles: ['chest', 'shoulders', 'middle back', 'lats', 'biceps', 'triceps', 'forearms']},
    {value: 'lower-body', label: 'Lower body', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves']},
    {value: 'chest', label: 'Chest', muscles: ['chest']},
    {value: 'back', label: 'Back', muscles: ['middle back', 'lats', 'lower back', 'traps']},
    {value: 'shoulders', label: 'Shoulders', muscles: ['shoulders']},
    {value: 'arms', label: 'Arms', muscles: ['biceps', 'triceps', 'forearms']},
    {value: 'glutes', label: 'Glutes', muscles: ['glutes']},
    {value: 'core', label: 'Core', muscles: ['abdominals']},
];

export const QUICK_SESSION_DURATIONS: ProgramDurationMinutes[] = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

export function matchesQuickSessionZone(candidate: Pick<GeneratorCandidate, 'primaryMuscles'>, zone: QuickSessionZone): boolean {
    const definition = QUICK_SESSION_ZONES.find((entry) => entry.value === zone);
    if (!definition) return false;
    return definition.muscles.length === 0 || candidate.primaryMuscles.some((muscle) => definition.muscles.includes(muscle));
}

export function quickSessionReplacementCandidates<T extends GeneratorCandidate>(
    candidates: T[],
    zone: QuickSessionZone,
    equipment: string[],
    selectedIds: Set<string>,
    current: Pick<GeneratedExercise, 'exerciseId' | 'movementPattern' | 'primaryMuscles' | 'alternativeExerciseIds'>,
    limit = 20,
): T[] {
    const eligible = candidates.filter((entry) =>
        !selectedIds.has(entry.id) &&
        entry.generatorEligible &&
        !entry.archived &&
        !entry.neverSuggest &&
        !entry.effectiveNeverSuggest &&
        matchesQuickSessionZone(entry, zone) &&
        (entry.equipmentTags.includes('body only') || entry.equipmentTags.some((tag) => equipment.includes(tag)))
    );
    const preferred = current.alternativeExerciseIds
        .map((id) => eligible.find((entry) => entry.id === id))
        .filter((entry): entry is T => entry !== undefined);
    const compatible = eligible.filter((entry) =>
        !preferred.some((preferredEntry) => preferredEntry.id === entry.id) &&
        (entry.movementPattern === current.movementPattern || entry.primaryMuscles.some((muscle) => current.primaryMuscles.includes(muscle)))
    );
    const remaining = eligible.filter((entry) =>
        !preferred.some((preferredEntry) => preferredEntry.id === entry.id) &&
        !compatible.some((compatibleEntry) => compatibleEntry.id === entry.id)
    );
    return [...preferred, ...compatible, ...remaining].slice(0, limit);
}

function roleFor(candidate: GeneratorCandidate): GeneratorRole {
    if (candidate.movementPattern === 'squat') return 'leg-assistance';
    if (candidate.movementPattern === 'hinge') return 'posterior-assistance';
    if (candidate.movementPattern === 'pull') return candidate.name.toLowerCase().includes('row') ? 'supported-pull' : 'vertical-pull';
    if (candidate.movementPattern === 'push') return candidate.name.toLowerCase().match(/shoulder|overhead|arnold|military/) ? 'vertical-push' : 'horizontal-push';
    return 'accessory';
}

function exercisePrescription(duration: ProgramDurationMinutes, role: GeneratorRole, index: number, sessionRestSeconds?: number) {
    const workingSets = duration <= 20 ? 2 : 3;
    const primary = ['horizontal-push', 'vertical-push', 'supported-pull', 'vertical-pull', 'leg-assistance', 'posterior-assistance'].includes(role);
    return {id: `quick:${duration}:${index}`, workingSets, repsMin: primary ? 8 : 10, repsMax: primary ? 12 : 15, targetRir: 2, restSeconds: sessionRestSeconds ?? (primary ? (duration >= 45 ? 90 : 75) : 60), loadReferenceKg: 0};
}

function quickSessionDuration(exercises: GeneratedExercise[], targetMinutes: ProgramDurationMinutes) {
    const execution = exercises.reduce((sum, exercise) => sum + exercise.prescription.workingSets * 50, 0);
    const rest = exercises.reduce((sum, exercise) => sum + Math.max(0, exercise.prescription.workingSets - 1) * exercise.prescription.restSeconds, 0);
    const setup = exercises.length * 60;
    const transitions = Math.max(0, exercises.length - 1) * 30;
    return {warmup: 0, ramp: 0, execution, rest, setup, transitions, conditioning: 0, total: execution + rest + setup + transitions, target: targetMinutes * 60};
}

export function generateQuickSession(rawInput: GeneratorInput, rawCandidates: GeneratorCandidate[], zone: QuickSessionZone): GenerationResult {
    const input = normalizeGeneratorInput({...rawInput, frequency: 1});
    const zoneDefinition = QUICK_SESSION_ZONES.find((entry) => entry.value === zone);
    if (!zoneDefinition || !input.equipment.length || !QUICK_SESSION_DURATIONS.includes(input.durationMinutes) || (input.sessionRestSeconds !== undefined && (!Number.isInteger(input.sessionRestSeconds) || input.sessionRestSeconds <= 0))) return {ok: false, code: 'INVALID_INPUT', message: 'Choose a body area, duration, recovery time and at least one equipment option.', exclusions: []};

    const exclusions: CandidateExclusion[] = [];
    const selections: CandidateSelection[] = [];
    const candidates = rawCandidates.flatMap((candidate) => {
        const role = roleFor(candidate);
        const constraint = evaluateHardConstraints(candidate, input, role);
        if (!constraint.allowed) { if (constraint.exclusion) exclusions.push(constraint.exclusion); return []; }
        const targetScore = zoneDefinition.muscles.length === 0 ? 0 : candidate.primaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length;
        if (!matchesQuickSessionZone(candidate, zone)) return [];
        const secondaryScore = candidate.secondaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length;
        const rotationScore = parseInt(stableHash(`${input.seed}:${zone}:${candidate.id}`).slice(0, 4), 16) / 0xffff * 18;
        const score = targetScore * 30 + secondaryScore * 3 + (candidate.favourite ? 15 : 0) + (candidate.media.length >= 2 ? 5 : 0) + rotationScore;
        return [{candidate, role, score, targetScore}];
    }).sort((a, b) => b.targetScore - a.targetScore || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));

    const muscleCoverage: typeof candidates = [];
    const rotatedMuscles = [...zoneDefinition.muscles].sort((a, b) => stableHash(`${input.seed}:${zone}:muscle:${a}`).localeCompare(stableHash(`${input.seed}:${zone}:muscle:${b}`)));
    for (const muscle of rotatedMuscles) {
        const entry = candidates.find((candidate) => candidate.candidate.primaryMuscles.includes(muscle) && !muscleCoverage.some((selected) => selected.candidate.id === candidate.candidate.id));
        if (entry) muscleCoverage.push(entry);
    }
    const diverse: typeof candidates = [];
    const patterns = new Set<string>();
    for (const entry of candidates) {
        if (patterns.has(entry.candidate.movementPattern)) continue;
        diverse.push(entry);
        patterns.add(entry.candidate.movementPattern);
    }
    const coverageIds = new Set(muscleCoverage.map((entry) => entry.candidate.id));
    const diverseIds = new Set(diverse.map((entry) => entry.candidate.id));
    const ordered = [...muscleCoverage, ...diverse.filter((entry) => !coverageIds.has(entry.candidate.id)), ...candidates.filter((entry) => !coverageIds.has(entry.candidate.id) && !diverseIds.has(entry.candidate.id))];
    const lowerBound = input.durationMinutes * 60 * 0.9;
    const upperBound = input.durationMinutes * 60 * 1.1;
    const minimumExercises = input.durationMinutes <= 20 ? 2 : 3;
    const exercises: GeneratedExercise[] = [];
    for (const entry of ordered) {
        if (exercises.length >= 10) break;
        if (exercises.length >= minimumExercises && quickSessionDuration(exercises, input.durationMinutes).total >= lowerBound) break;
        const index = exercises.length;
        const prescription = exercisePrescription(input.durationMinutes, entry.role, index, input.sessionRestSeconds);
        const reasons = [`Targets ${zoneDefinition.label.toLowerCase()}.`, 'Fits the selected time budget, including rest, and available equipment.'];
        const exercise = {exerciseId: entry.candidate.id, exerciseName: entry.candidate.name, movementPattern: entry.candidate.movementPattern, primaryMuscles: [...entry.candidate.primaryMuscles], role: entry.role, prescription, locked: false, alternativeExerciseIds: candidates.filter((other) => other.candidate.id !== entry.candidate.id && other.targetScore > 0).slice(0, 3).map((other) => other.candidate.id), score: entry.score, reasons};
        const proposedDuration = quickSessionDuration([...exercises, exercise], input.durationMinutes).total;
        if (exercises.length >= minimumExercises && proposedDuration > upperBound) continue;
        exercises.push(exercise);
        selections.push({exerciseId: entry.candidate.id, role: entry.role, score: entry.score, reasons});
    }
    if (exercises.length < minimumExercises) return {ok: false, code: 'NO_VALID_CANDIDATE', message: `Not enough eligible exercises for a ${input.durationMinutes}-minute ${zoneDefinition.label.toLowerCase()} session. Adjust equipment or exercise exclusions.`, exclusions};
    const duration = quickSessionDuration(exercises, input.durationMinutes);
    if (duration.total < lowerBound || duration.total > upperBound) return {ok: false, code: 'VALIDATION_FAILED', message: `Could not build a coherent ${input.durationMinutes}-minute session with the selected equipment.`, exclusions};
    const day = {name: `${zoneDefinition.label} session`, emphasis: `Focused ${zoneDefinition.label.toLowerCase()} training`, targetDurationMinutes: input.durationMinutes, warmup: [], conditioning: {kind: 'low-impact' as const, name: 'No finisher added', seconds: 0}, exercises, duration, warnings: []};
    const weeklyPatterns: Record<string, number> = {};
    const weeklyMuscles: Record<string, number> = {};
    for (const exercise of exercises) {
        weeklyPatterns[exercise.movementPattern] = (weeklyPatterns[exercise.movementPattern] ?? 0) + exercise.prescription.workingSets;
        for (const muscle of exercise.primaryMuscles) weeklyMuscles[muscle] = (weeklyMuscles[muscle] ?? 0) + exercise.prescription.workingSets;
    }
    const explanation = {normalizedInput: input, selections, exclusions, warnings: [], weeklyPatterns, weeklyMuscles};
    const program: GeneratedProgram = {name: `${zoneDefinition.label} · ${input.durationMinutes} min`, frequency: 1, durationMinutes: input.durationMinutes, seed: input.seed, generatorVersion: input.generatorVersion, sessionRestSeconds: input.sessionRestSeconds, identityHash: stableHash(JSON.stringify({input, day, explanation})), days: [day], explanation};
    return {ok: true, program};
}
