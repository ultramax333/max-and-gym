import {effectiveEquipmentTags} from '../workout/equipmentStations';
import {evaluateHardConstraints} from './constraints';
import {normalizeGeneratorInput, stableHash} from './deterministicGenerator';
import {CandidateExclusion, CandidateSelection, GeneratedExercise, GeneratedProgram, GenerationResult, GeneratorCandidate, GeneratorInput, GeneratorRole} from './types';
import {ProgramDurationMinutes} from '../programs/types';
import {isReviewedSecondaryLowerBack, matchesQuickSessionZone, QUICK_SESSION_ZONES, QuickSessionZone, selectExerciseAlternatives} from '../exerciseCatalog/selection';
export {matchesQuickSessionZone, QUICK_SESSION_ZONES, type QuickSessionZone} from '../exerciseCatalog/selection';

export const QUICK_SESSION_DURATIONS: ProgramDurationMinutes[] = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
export const LOWER_BACK_MAX_DURATION_MINUTES = 30;
export const MIXED_LOWER_BACK_MAX_DURATION_MINUTES = 45;
const MIXED_LOWER_BACK_EXTENSION_IDS = new Set(['fedb:Hyperextensions_Back_Extensions', 'fedb:Hyperextensions_With_No_Hyperextension_Bench', 'fedb:Weighted_Ball_Hyperextension']);
const MIXED_LOWER_BACK_HEAVY_HINGE_IDS = new Set(['fedb:Barbell_Deadlift', 'fedb:Romanian_Deadlift']);
const FULL_BACK_BENCH_EXTENSION_ID = 'fedb:Hyperextensions_Back_Extensions';

export function quickSessionReplacementCandidates<T extends GeneratorCandidate>(
    candidates: T[],
    zone: QuickSessionZone,
    equipment: string[],
    selectedIds: Set<string>,
    current: Pick<GeneratedExercise, 'exerciseId' | 'movementPattern' | 'primaryMuscles' | 'alternativeExerciseIds'>,
    limit = 20,
): T[] {
    return selectExerciseAlternatives(candidates, {...current, id: current.exerciseId}, {zone, equipment, selectedIds, preferredIds: current.alternativeExerciseIds, limit});
}

function roleFor(candidate: GeneratorCandidate): GeneratorRole {
    if (candidate.movementPattern === 'squat') return 'leg-assistance';
    if (candidate.movementPattern === 'hinge') return 'posterior-assistance';
    if (candidate.movementPattern === 'pull') return candidate.name.toLowerCase().includes('row') ? 'supported-pull' : 'vertical-pull';
    if (candidate.movementPattern === 'push') return candidate.name.toLowerCase().match(/shoulder|overhead|arnold|military/) ? 'vertical-push' : 'horizontal-push';
    return 'accessory';
}

export function primaryEquipment(equipmentTags: string[] | undefined): string {
    return equipmentTags?.find((tag) => tag.trim()) ?? 'body only';
}

export function groupExercisesByEquipment(exercises: GeneratedExercise[]): GeneratedExercise[] {
    const groupOrder = new Map<string, number>();
    for (const exercise of exercises) {
        const equipment = exercise.primaryEquipmentStation ?? primaryEquipment(exercise.equipmentTags);
        if (!groupOrder.has(equipment)) groupOrder.set(equipment, groupOrder.size);
    }
    return exercises.map((exercise, index) => ({exercise, index})).sort((left, right) => {
        const leftEquipment = left.exercise.primaryEquipmentStation ?? primaryEquipment(left.exercise.equipmentTags);
        const rightEquipment = right.exercise.primaryEquipmentStation ?? primaryEquipment(right.exercise.equipmentTags);
        const groupDifference = (groupOrder.get(leftEquipment) ?? 0) - (groupOrder.get(rightEquipment) ?? 0);
        return groupDifference || left.index - right.index;
    }).map(({exercise}) => exercise);
}

function exercisePrescription(duration: ProgramDurationMinutes, role: GeneratorRole, goal: GeneratorInput['goal'], index: number, sessionRestSeconds?: number, contextualRating?: number) {
    const primary = ['horizontal-push', 'vertical-push', 'supported-pull', 'vertical-pull', 'leg-assistance', 'posterior-assistance'].includes(role);
    let workingSets: number;
    if (duration <= 20) workingSets = 2;
    else if (goal === 'strength') workingSets = primary ? (duration >= 50 ? 5 : 4) : (index % 2 === 0 ? 3 : 2);
    else if (goal === 'endurance') workingSets = primary ? (duration >= 45 ? 4 : 3) : (duration >= 40 && index % 2 === 0 ? 4 : 3);
    else if (goal === 'hypertrophy') workingSets = primary ? (duration >= 35 ? 4 : 3) : (index % 2 === 0 ? 3 : 2);
    else workingSets = primary ? (duration >= 45 ? 4 : 3) : (index % 2 === 0 ? 3 : 2);
    if (contextualRating === 5 && duration >= 30) workingSets = Math.min(5, workingSets + 1);
    if (contextualRating !== undefined && contextualRating <= 2) workingSets = Math.max(2, workingSets - 1);
    const profile = goal === 'strength'
        ? {repsMin: primary ? 4 : 6, repsMax: primary ? 6 : 8, restSeconds: primary ? 180 : 120}
        : goal === 'endurance'
            ? {repsMin: 15, repsMax: primary ? 20 : 25, restSeconds: 45}
            : goal === 'balanced'
                ? {repsMin: primary ? 6 : 8, repsMax: primary ? 10 : 12, restSeconds: primary ? 120 : 75}
                : {repsMin: primary ? 8 : 10, repsMax: primary ? 12 : 15, restSeconds: primary ? 90 : 60};
    const optionalRepIncrease = contextualRating !== undefined && contextualRating >= 4 && goal !== 'strength' ? 1 : 0;
    return {id: `quick:${duration}:${goal}:${index}`, workingSets, repsMin: profile.repsMin, repsMax: profile.repsMax + optionalRepIncrease, targetRir: 2, restSeconds: sessionRestSeconds ?? profile.restSeconds, loadReferenceKg: 0};
}

function quickSessionDuration(exercises: GeneratedExercise[], targetMinutes: ProgramDurationMinutes) {
    const execution = exercises.reduce((sum, exercise) => {
        const averageReps = (exercise.prescription.repsMin + exercise.prescription.repsMax) / 2;
        const secondsPerSet = Math.min(85, Math.max(30, Math.round(10 + averageReps * 3)));
        return sum + exercise.prescription.workingSets * secondsPerSet;
    }, 0);
    const rest = exercises.reduce((sum, exercise) => sum + Math.max(0, exercise.prescription.workingSets - 1) * exercise.prescription.restSeconds, 0);
    const setup = exercises.length * 60;
    const transitions = Math.max(0, exercises.length - 1) * 30;
    return {warmup: 0, ramp: 0, execution, rest, setup, transitions, conditioning: 0, total: execution + rest + setup + transitions, target: targetMinutes * 60};
}

export function generateQuickSession(rawInput: GeneratorInput, rawCandidates: GeneratorCandidate[], zone: QuickSessionZone): GenerationResult {
    const input = normalizeGeneratorInput({...rawInput, frequency: 1});
    const zoneDefinition = QUICK_SESSION_ZONES.find((entry) => entry.value === zone);
    if (!zoneDefinition || !input.equipment.length || !QUICK_SESSION_DURATIONS.includes(input.durationMinutes) || (input.sessionRestSeconds !== undefined && (!Number.isInteger(input.sessionRestSeconds) || input.sessionRestSeconds <= 0))) return {ok: false, code: 'INVALID_INPUT', message: 'Choose a body area, duration, recovery time and at least one equipment option.', exclusions: []};
    if (zone === 'lower-back' && input.durationMinutes > LOWER_BACK_MAX_DURATION_MINUTES) return {ok: false, code: 'INVALID_INPUT', message: 'Lower back is a short focus (15–30 minutes) in this library. Choose Full back for a longer session.', exclusions: []};
    if (zone === 'lower-back-mixed' && input.durationMinutes > MIXED_LOWER_BACK_MAX_DURATION_MINUTES) return {ok: false, code: 'INVALID_INPUT', message: 'Lower back + supporting work fits 15–45 minutes without stacking repetitive hinges or extensions. Choose Full back for 50–60 minutes.', exclusions: []};

    const exclusions: CandidateExclusion[] = [];
    const selections: CandidateSelection[] = [];
    const candidates = rawCandidates.flatMap((candidate) => {
        const role = roleFor(candidate);
        const constraint = evaluateHardConstraints(candidate, input, role);
        if (!constraint.allowed) { if (constraint.exclusion) exclusions.push(constraint.exclusion); return []; }
        const focusMatch = candidate.generatorFocusZones?.includes(zone) === true;
        const targetScore = zoneDefinition.muscles.length === 0 ? 0 : candidate.primaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length + (focusMatch ? 1 : 0);
        if (!matchesQuickSessionZone(candidate, zone)) return [];
        const secondaryScore = candidate.secondaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle)).length;
        const rotationScore = parseInt(stableHash(`${input.seed}:${zone}:${candidate.id}`).slice(0, 4), 16) / 0xffff * 18;
        const recentPenalty = input.recentExerciseIds?.includes(candidate.id) ? 45 : 0;
        const contextualRating = input.contextualExerciseRatings?.find((entry) => entry.exerciseId === candidate.id)?.rating;
        const accessDifficulty = candidate.accessDifficulty ?? 'normal';
        const accessPenalty = input.gymContext?.occupancyLevel === 'busy'
            ? accessDifficulty === 'hard' || candidate.requiredStationCount === 2 ? 70 : accessDifficulty === 'limited' ? 35 : 0
            : input.gymContext?.occupancyLevel === 'moderate'
                ? accessDifficulty === 'hard' || candidate.requiredStationCount === 2 ? 25 : accessDifficulty === 'limited' ? 10 : 0
                : 0;
        const score = targetScore * 30 + secondaryScore * 3 + (candidate.favourite ? 15 : 0) + (candidate.media.length >= 2 ? 5 : 0) + rotationScore - recentPenalty - accessPenalty + (contextualRating === undefined ? 0 : (contextualRating - 3) * 12);
        return [{candidate, role, score, targetScore, contextualRating, accessPenalty}];
    }).sort((a, b) => b.targetScore - a.targetScore || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
    if (zone === 'lower-back-mixed' && !candidates.some(entry => entry.candidate.primaryMuscles.includes('lower back'))) return {ok: false, code: 'NO_VALID_CANDIDATE', message: 'At least one direct lower-back exercise is needed. Re-enable suitable equipment or choose Full back.', exclusions};
    if (zone === 'lower-back-mixed' && !candidates.some(entry => isReviewedSecondaryLowerBack(entry.candidate))) return {ok: false, code: 'NO_VALID_CANDIDATE', message: 'No reviewed secondary lower-back movement is available with your equipment and exclusions. Choose Lower back or change the filters.', exclusions};

    const muscleCoverage: typeof candidates = [];
    const fullBackBenchExtension = zone === 'back'
        ? candidates.find((entry) => entry.candidate.id === FULL_BACK_BENCH_EXTENSION_ID)
        : undefined;
    const rotatedMuscles = [...zoneDefinition.muscles].sort((a, b) => stableHash(`${input.seed}:${zone}:muscle:${a}`).localeCompare(stableHash(`${input.seed}:${zone}:muscle:${b}`)));
    for (const muscle of rotatedMuscles) {
        const entry = muscle === 'lower back' && fullBackBenchExtension
            ? fullBackBenchExtension
            : candidates.find((candidate) => candidate.candidate.primaryMuscles.includes(muscle) && !muscleCoverage.some((selected) => selected.candidate.id === candidate.candidate.id));
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
    const secondaryAnchor = zone === 'lower-back-mixed' ? candidates.find(entry => isReviewedSecondaryLowerBack(entry.candidate)) : undefined;
    const anchorIds = new Set([...coverageIds, ...(secondaryAnchor ? [secondaryAnchor.candidate.id] : [])]);
    const ordered = [...(fullBackBenchExtension ? [fullBackBenchExtension] : []), ...muscleCoverage.filter((entry) => entry.candidate.id !== fullBackBenchExtension?.candidate.id), ...(secondaryAnchor ? [secondaryAnchor] : []), ...diverse.filter((entry) => !anchorIds.has(entry.candidate.id)), ...candidates.filter((entry) => !anchorIds.has(entry.candidate.id) && !diverseIds.has(entry.candidate.id))];
    const lowerBound = input.durationMinutes * 60 * 0.9;
    const upperBound = input.durationMinutes * 60 * 1.1;
    const minimumExercises = input.durationMinutes <= 20 ? 2 : 3;
    const exercises: GeneratedExercise[] = [];
    for (const entry of ordered) {
        if (exercises.length >= 10) break;
        if (exercises.length >= minimumExercises && quickSessionDuration(exercises, input.durationMinutes).total >= lowerBound) break;
        if (zone === 'lower-back-mixed' && [MIXED_LOWER_BACK_EXTENSION_IDS, MIXED_LOWER_BACK_HEAVY_HINGE_IDS].some(family => family.has(entry.candidate.id) && exercises.some(exercise => family.has(exercise.exerciseId)))) continue;
        const index = exercises.length;
        const prescription = exercisePrescription(input.durationMinutes, entry.role, input.goal, index, input.sessionRestSeconds, entry.contextualRating);
        const primaryZoneMatch = entry.candidate.primaryMuscles.some((muscle) => zoneDefinition.muscles.includes(muscle));
        const reasons = [primaryZoneMatch || zoneDefinition.muscles.length === 0
            ? zone === 'lower-back-mixed' ? 'Directly targets lower back.' : `Targets ${zoneDefinition.label.toLowerCase()}.`
            : `Lower back works secondarily; source primary muscle: ${entry.candidate.primaryMuscles.join(', ')}.`, ...(zone === 'back' && entry.candidate.id === FULL_BACK_BENCH_EXTENSION_ID ? ['Back-extension bench coverage keeps lower back represented in a Full back session.'] : []), 'Fits the selected time budget, including rest, and available equipment.', ...(entry.contextualRating === undefined ? [] : [`Rated ${entry.contextualRating}/5 for this ${zoneDefinition.label.toLowerCase()} ${input.goal} context.`]), ...(input.recentExerciseIds?.includes(entry.candidate.id) ? ['Repeated only because it remained one of the best coherent fits.'] : []), ...(entry.accessPenalty ? ['Kept despite limited equipment access because it remains a coherent fit.'] : [])];
        const exercise = {exerciseId: entry.candidate.id, exerciseName: entry.candidate.name, movementPattern: entry.candidate.movementPattern, primaryMuscles: [...entry.candidate.primaryMuscles], equipmentTags: effectiveEquipmentTags(entry.candidate), requiredEquipmentStations: entry.candidate.requiredEquipmentStations ? [...entry.candidate.requiredEquipmentStations] : undefined, primaryEquipmentStation: entry.candidate.primaryEquipmentStation, accessDifficulty: entry.candidate.accessDifficulty, requiredStationCount: entry.candidate.requiredStationCount, role: entry.role, prescription, locked: false, alternativeExerciseIds: candidates.filter((other) => other.candidate.id !== entry.candidate.id && (!primaryZoneMatch || other.candidate.primaryMuscles.includes('lower back') || zone !== 'lower-back-mixed')).slice(0, 3).map((other) => other.candidate.id), score: entry.score, reasons};
        const proposedDuration = quickSessionDuration([...exercises, exercise], input.durationMinutes).total;
        if (exercises.length >= minimumExercises && proposedDuration > upperBound) continue;
        exercises.push(exercise);
        selections.push({exerciseId: entry.candidate.id, role: entry.role, score: entry.score, reasons});
    }
    if (exercises.length < minimumExercises) return {ok: false, code: 'NO_VALID_CANDIDATE', message: `Not enough eligible exercises for a ${input.durationMinutes}-minute ${zoneDefinition.label.toLowerCase()} session. Adjust equipment or exercise exclusions.`, exclusions};
    if (zone === 'lower-back-mixed' && !exercises.some(exercise => exercise.primaryMuscles.includes('lower back'))) return {ok: false, code: 'VALIDATION_FAILED', message: 'The session needs at least one direct lower-back exercise.', exclusions};
    if (zone === 'lower-back-mixed' && !exercises.some(exercise => candidates.some(entry => entry.candidate.id === exercise.exerciseId && isReviewedSecondaryLowerBack(entry.candidate)))) return {ok: false, code: 'VALIDATION_FAILED', message: 'The session needs at least one reviewed secondary lower-back movement.', exclusions};
    const backMuscleSetTotals = () => Object.fromEntries(zoneDefinition.muscles.map((muscle) => [muscle, exercises.reduce((sum, exercise) => sum + (exercise.primaryMuscles.includes(muscle) ? exercise.prescription.workingSets : 0), 0)]));
    const leastCoveredSets = (exercise: GeneratedExercise, totals: Record<string, number>) => {
        const covered = exercise.primaryMuscles.filter((muscle) => zoneDefinition.muscles.includes(muscle));
        return covered.length ? Math.min(...covered.map((muscle) => totals[muscle] ?? 0)) : Number.MAX_SAFE_INTEGER;
    };
    if (zone === 'back') {
        const totals = backMuscleSetTotals();
        const recipient = [...exercises].filter((exercise) => exercise.prescription.workingSets < 5)
            .sort((a, b) => leastCoveredSets(a, totals) - leastCoveredSets(b, totals) || a.prescription.workingSets - b.prescription.workingSets)
            .find((exercise) => quickSessionDuration(exercises.map((entry) => entry === exercise ? {...entry, prescription: {...entry.prescription, workingSets: entry.prescription.workingSets + 1}} : entry), input.durationMinutes).total <= upperBound);
        if (recipient) {
            recipient.prescription.workingSets++;
            recipient.reasons.push('An extra working set was assigned to one of the least-covered back muscles; recovery is unchanged.');
        }
    }
    // Corrected isolation classifications can shorten the initial plan. Fill a
    // small remaining budget with balanced working sets, never shorter rests or
    // an unrelated exercise. Keep the documented maximum of five sets.
    while (quickSessionDuration(exercises, input.durationMinutes).total < lowerBound) {
        const backMuscleSets = backMuscleSetTotals();
        const next = [...exercises].sort((a, b) => (zone === 'back' ? leastCoveredSets(a, backMuscleSets) - leastCoveredSets(b, backMuscleSets) : 0) || a.prescription.workingSets - b.prescription.workingSets)
            .find(exercise => exercise.prescription.workingSets < 5 && quickSessionDuration(exercises.map(entry => entry === exercise ? {...entry, prescription: {...entry.prescription, workingSets: entry.prescription.workingSets + 1}} : entry), input.durationMinutes).total <= upperBound);
        if (!next) break;
        next.prescription.workingSets++;
        const reason = zone === 'back'
            ? 'An extra working set was assigned to one of the least-covered back muscles; recovery is unchanged.'
            : 'Working sets adjusted within the 2–5 set range to fit the session; recovery is unchanged.';
        if (!next.reasons.includes(reason)) next.reasons.push(reason);
    }
    const groupedExercises = groupExercisesByEquipment(exercises);
    const duration = quickSessionDuration(groupedExercises, input.durationMinutes);
    if (duration.total < lowerBound || duration.total > upperBound) return {ok: false, code: 'VALIDATION_FAILED', message: `Could not build a coherent ${input.durationMinutes}-minute session with the selected equipment.`, exclusions};
    const goalLabel = input.goal === 'strength' ? 'Strength' : input.goal === 'endurance' ? 'Endurance' : input.goal === 'hypertrophy' ? 'Hypertrophy' : 'Balanced';
    const day = {name: `${zoneDefinition.label} session`, emphasis: `${goalLabel} · focused ${zoneDefinition.label.toLowerCase()} training`, targetDurationMinutes: input.durationMinutes, warmup: [], conditioning: {kind: 'low-impact' as const, name: 'No finisher added', seconds: 0}, exercises: groupedExercises, duration, warnings: []};
    const weeklyPatterns: Record<string, number> = {};
    const weeklyMuscles: Record<string, number> = {};
    for (const exercise of groupedExercises) {
        weeklyPatterns[exercise.movementPattern] = (weeklyPatterns[exercise.movementPattern] ?? 0) + exercise.prescription.workingSets;
        for (const muscle of exercise.primaryMuscles) weeklyMuscles[muscle] = (weeklyMuscles[muscle] ?? 0) + exercise.prescription.workingSets;
    }
    const explanation = {normalizedInput: input, selections, exclusions, warnings: [], weeklyPatterns, weeklyMuscles};
    const program: GeneratedProgram = {name: `${zoneDefinition.label} · ${goalLabel} · ${input.durationMinutes} min`, frequency: 1, durationMinutes: input.durationMinutes, seed: input.seed, generatorVersion: input.generatorVersion, sessionRestSeconds: input.sessionRestSeconds, sessionContext: {zone, goal: input.goal}, identityHash: stableHash(JSON.stringify({input, day, explanation})), days: [day], explanation};
    return {ok: true, program};
}
