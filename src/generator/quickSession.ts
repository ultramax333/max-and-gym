import {evaluateHardConstraints} from './constraints';
import {estimateGeneratedDay, normalizeGeneratorInput, stableHash} from './deterministicGenerator';
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

function exerciseCount(duration: ProgramDurationMinutes): number {
    if (duration <= 20) return 3;
    if (duration <= 35) return 4;
    if (duration <= 50) return 5;
    return 6;
}

function exercisePrescription(duration: ProgramDurationMinutes, role: GeneratorRole, index: number) {
    const workingSets = duration >= 60 ? 4 : duration <= 20 ? 2 : 3;
    const primary = ['horizontal-push', 'vertical-push', 'supported-pull', 'vertical-pull', 'leg-assistance', 'posterior-assistance'].includes(role);
    return {id: `quick:${duration}:${index}`, workingSets, repsMin: primary ? 8 : 10, repsMax: primary ? 12 : 15, targetRir: 2, restSeconds: primary ? (duration >= 45 ? 90 : 75) : 60, loadReferenceKg: 0};
}

function warmupSeconds(duration: ProgramDurationMinutes): number {
    return duration <= 20 ? 120 : duration <= 40 ? 240 : 300;
}

export function generateQuickSession(rawInput: GeneratorInput, rawCandidates: GeneratorCandidate[], zone: QuickSessionZone): GenerationResult {
    const input = normalizeGeneratorInput({...rawInput, frequency: 1});
    const zoneDefinition = QUICK_SESSION_ZONES.find((entry) => entry.value === zone);
    if (!zoneDefinition || !input.equipment.length || !QUICK_SESSION_DURATIONS.includes(input.durationMinutes)) return {ok: false, code: 'INVALID_INPUT', message: 'Choose a body area, duration and at least one equipment option.', exclusions: []};

    const exclusions: CandidateExclusion[] = [];
    const selections: CandidateSelection[] = [];
    const candidates = rawCandidates.flatMap((candidate) => {
        const role = roleFor(candidate);
        const constraint = evaluateHardConstraints(candidate, input, role);
        if (!constraint.allowed) { if (constraint.exclusion) exclusions.push(constraint.exclusion); return []; }
        const targetScore = zoneDefinition.muscles.length === 0 ? 0 : candidate.primaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length;
        if (!matchesQuickSessionZone(candidate, zone)) return [];
        const secondaryScore = candidate.secondaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length;
        const score = targetScore * 30 + secondaryScore * 3 + (candidate.favourite ? 15 : 0) + (candidate.media.length >= 2 ? 5 : 0) + parseInt(stableHash(`${input.seed}:${zone}:${candidate.id}`).slice(0, 4), 16) / 0xffff;
        return [{candidate, role, score, targetScore}];
    }).sort((a, b) => b.targetScore - a.targetScore || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));

    const selected: typeof candidates = [];
    const patterns = new Set<string>();
    for (const entry of candidates) {
        if (selected.length >= exerciseCount(input.durationMinutes)) break;
        if (patterns.has(entry.candidate.movementPattern) && selected.length < exerciseCount(input.durationMinutes) - 1) continue;
        selected.push(entry);
        patterns.add(entry.candidate.movementPattern);
    }
    if (selected.length < Math.min(3, exerciseCount(input.durationMinutes))) return {ok: false, code: 'NO_VALID_CANDIDATE', message: `Not enough eligible exercises for ${zoneDefinition.label}. Adjust equipment or exercise exclusions.`, exclusions};

    const exercises: GeneratedExercise[] = selected.map((entry, index) => {
        const prescription = exercisePrescription(input.durationMinutes, entry.role, index);
        const reasons = [`Targets ${zoneDefinition.label.toLowerCase()}.`, 'Matches the available equipment and local exercise catalog.'];
        selections.push({exerciseId: entry.candidate.id, role: entry.role, score: entry.score, reasons});
        return {exerciseId: entry.candidate.id, exerciseName: entry.candidate.name, movementPattern: entry.candidate.movementPattern, primaryMuscles: [...entry.candidate.primaryMuscles], role: entry.role, prescription, locked: false, alternativeExerciseIds: candidates.filter((other) => other.candidate.id !== entry.candidate.id && other.targetScore > 0).slice(0, 3).map((other) => other.candidate.id), score: entry.score, reasons};
    });

    const warmup = warmupSeconds(input.durationMinutes);
    const duration = estimateGeneratedDay(exercises, warmup, 0, input.durationMinutes);
    const conditioningSeconds = Math.max(0, Math.min(600, input.durationMinutes * 60 - duration.total));
    const finalDuration = estimateGeneratedDay(exercises, warmup, conditioningSeconds, input.durationMinutes);
    const day = {name: `${zoneDefinition.label} session`, emphasis: `Focused ${zoneDefinition.label.toLowerCase()} training`, targetDurationMinutes: input.durationMinutes, warmup: [{id: 'quick-warmup', name: 'General warm-up and target-joint mobility', seconds: warmup, reason: 'Prepare the joints used in this session.'}], conditioning: {kind: 'low-impact' as const, name: conditioningSeconds ? 'Optional low-impact finisher' : 'No conditioning added', seconds: conditioningSeconds}, exercises, duration: finalDuration, warnings: []};
    const weeklyPatterns: Record<string, number> = {};
    const weeklyMuscles: Record<string, number> = {};
    for (const exercise of exercises) {
        weeklyPatterns[exercise.movementPattern] = (weeklyPatterns[exercise.movementPattern] ?? 0) + exercise.prescription.workingSets;
        for (const muscle of exercise.primaryMuscles) weeklyMuscles[muscle] = (weeklyMuscles[muscle] ?? 0) + exercise.prescription.workingSets;
    }
    const explanation = {normalizedInput: input, selections, exclusions, warnings: [], weeklyPatterns, weeklyMuscles};
    const program: GeneratedProgram = {name: `${zoneDefinition.label} · ${input.durationMinutes} min`, frequency: 1, durationMinutes: input.durationMinutes, seed: input.seed, generatorVersion: input.generatorVersion, identityHash: stableHash(JSON.stringify({input, day, explanation})), days: [day], explanation};
    return {ok: true, program};
}
