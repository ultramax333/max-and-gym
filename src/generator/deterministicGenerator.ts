import {evaluateHardConstraints, matchesRole} from './constraints';
import {CandidateExclusion, CandidateSelection, GeneratedDay, GeneratedExercise, GeneratedProgram, GenerationResult, GeneratorCandidate, GeneratorDurationBreakdown, GeneratorInput, GeneratorRole, NormalizedGeneratorInput, WarmupStep} from './types';
import {WEEKLY_ROLE_TEMPLATES} from './seedPrograms';

export function stableHash(value: string): string {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

const uniqueSorted = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export function normalizeGeneratorInput(input: GeneratorInput): NormalizedGeneratorInput {
    const normalized: GeneratorInput = {...input, equipment: uniqueSorted(input.equipment), priorityMuscles: uniqueSorted(input.priorityMuscles), blockedExerciseIds: uniqueSorted(input.blockedExerciseIds), blockedTags: uniqueSorted(input.blockedTags), favouriteExerciseIds: uniqueSorted(input.favouriteExerciseIds), neverSuggestExerciseIds: uniqueSorted(input.neverSuggestExerciseIds), stableExercises: [...input.stableExercises].sort((a, b) => a.dayIndex - b.dayIndex || a.role.localeCompare(b.role) || a.exerciseId.localeCompare(b.exerciseId)), seed: input.seed.trim() || 'maxgym-default'};
    return {...normalized, inputHash: stableHash(JSON.stringify(normalized))};
}

function prescriptionFor(role: GeneratorRole, duration: 40 | 60, goal: GeneratorInput['goal'], id: string) {
    const primary = ['knee-dominant', 'hinge', 'horizontal-push', 'vertical-push'].includes(role);
    const sets = primary ? (duration === 60 ? 4 : 3) : role === 'accessory' ? (duration === 60 ? 2 : 2) : 3;
    const strength = primary && goal !== 'hypertrophy';
    return {id, workingSets: sets, repsMin: strength ? 4 : 8, repsMax: strength ? 6 : 12, targetRir: 2, restSeconds: primary ? (duration === 60 ? 180 : 150) : role === 'accessory' ? 60 : duration === 60 ? 120 : 90, loadReferenceKg: 0};
}

function warmup(lowBackComfort: boolean, duration: 40 | 60): WarmupStep[] {
    if (lowBackComfort) return [
        {id: 'easy-cardio', name: 'Vélo doux ou marche', seconds: 120, reason: 'Élever progressivement la température.'},
        {id: 'cat-camel', name: 'Cat-camel doux', seconds: 45, reason: 'Mobilité contrôlée, sans forcer une amplitude.'},
        {id: 'bird-dog', name: 'Bird dog contrôlé', seconds: 60, reason: 'Préparer le contrôle du tronc.'},
        {id: 'glute-bridge', name: 'Glute bridge', seconds: 60, reason: 'Préparer les hanches.'},
        {id: 'hinge-practice', name: 'Hinge-to-wall ou mouvement à vide', seconds: duration === 60 ? 135 : 15, reason: 'Répéter le patron de la séance.'},
    ];
    return [{id: 'easy-cardio', name: 'Cardio doux', seconds: 120, reason: 'Élever progressivement la température.'}, {id: 'dynamic-prep', name: 'Mobilité dynamique ciblée', seconds: 120, reason: 'Préparer les articulations utilisées.'}, ...(duration === 60 ? [{id: 'movement-practice', name: 'Mouvement spécifique à vide', seconds: 180, reason: 'Préparer le premier mouvement principal.'}] : [{id: 'movement-practice', name: 'Mouvement spécifique à vide', seconds: 60, reason: 'Préparer le premier mouvement principal.'}])];
}

export function estimateGeneratedDay(exercises: GeneratedExercise[], warmupSeconds: number, conditioningSeconds: number, targetMinutes: 40 | 60): GeneratorDurationBreakdown {
    const ramp = exercises.filter((entry) => ['knee-dominant', 'hinge', 'horizontal-push', 'vertical-push'].includes(entry.role)).length * 180;
    const execution = exercises.reduce((sum, entry) => sum + entry.prescription.workingSets * 40, 0);
    const rest = exercises.reduce((sum, entry) => sum + Math.max(0, entry.prescription.workingSets - 1) * entry.prescription.restSeconds, 0);
    const setup = exercises.length * 75;
    const transitions = Math.max(0, exercises.length - 1) * 45;
    const total = warmupSeconds + ramp + execution + rest + setup + transitions + conditioningSeconds;
    return {warmup: warmupSeconds, ramp, execution, rest, setup, transitions, conditioning: conditioningSeconds, total, target: targetMinutes * 60};
}

function scoreCandidate(candidate: GeneratorCandidate, role: GeneratorRole, input: NormalizedGeneratorInput): {score: number; reasons: string[]} {
    let score = 100;
    const reasons = ['Correspond au rôle de mouvement requis.'];
    if (input.priorityMuscles.some((muscle) => candidate.primaryMuscles.includes(muscle))) { score += 20; reasons.push('Couvre un muscle prioritaire.'); }
    if (input.favouriteExerciseIds.includes(candidate.id) || candidate.favourite) { score += 15; reasons.push('Exercice favori.'); }
    if (candidate.media.length >= 2) { score += 5; reasons.push('Instructions et médias locaux revus.'); }
    score -= Math.max(0, candidate.setupTags.length - 1) * 3;
    score += parseInt(stableHash(`${input.seed}:${role}:${candidate.id}`).slice(0, 4), 16) / 0xffff;
    return {score, reasons};
}

function selectExercise(role: GeneratorRole, dayIndex: number, candidates: GeneratorCandidate[], input: NormalizedGeneratorInput, used: Set<string>, exclusions: CandidateExclusion[], selections: CandidateSelection[]): GeneratedExercise | undefined {
    const stable = input.stableExercises.find((entry) => entry.dayIndex === dayIndex && entry.role === role);
    const ranked = candidates.flatMap((candidate) => {
        const constraint = evaluateHardConstraints(candidate, input, role);
        if (!constraint.allowed) { if (constraint.exclusion) exclusions.push(constraint.exclusion); return []; }
        if (!matchesRole(candidate, role)) return [];
        if (used.has(candidate.id) && candidate.id !== stable?.exerciseId) return [];
        const scored = scoreCandidate(candidate, role, input);
        return [{candidate, ...scored}];
    }).sort((a, b) => Number(b.candidate.id === stable?.exerciseId) - Number(a.candidate.id === stable?.exerciseId) || b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
    const selected = ranked[0];
    if (!selected) return undefined;
    used.add(selected.candidate.id);
    const prescription = stable?.exerciseId === selected.candidate.id ? {...stable.prescription} : prescriptionFor(role, input.durationMinutes, input.goal, `generated:${dayIndex}:${role}`);
    const reasons = stable?.exerciseId === selected.candidate.id ? ['Exercice principal stable conservé.', ...selected.reasons] : selected.reasons;
    selections.push({exerciseId: selected.candidate.id, role, score: selected.score, reasons});
    const alternatives = ranked.slice(1, 4).map((entry) => entry.candidate.id);
    return {exerciseId: selected.candidate.id, exerciseName: selected.candidate.name, movementPattern: selected.candidate.movementPattern, primaryMuscles: [...selected.candidate.primaryMuscles], role, prescription, locked: stable?.exerciseId === selected.candidate.id ? stable.locked : ['knee-dominant', 'hinge', 'horizontal-push', 'vertical-push'].includes(role), stableUntil: stable?.stableUntil, alternativeExerciseIds: alternatives, score: selected.score, reasons};
}

export function generateProgram(rawInput: GeneratorInput, rawCandidates: GeneratorCandidate[]): GenerationResult {
    const input = normalizeGeneratorInput(rawInput);
    if (![2, 3].includes(input.frequency) || ![40, 60].includes(input.durationMinutes) || !input.equipment.length) return {ok: false, code: 'INVALID_INPUT', message: 'Fréquence, durée ou équipement invalide.', exclusions: []};
    const candidates = [...rawCandidates].sort((a, b) => a.id.localeCompare(b.id));
    const exclusions: CandidateExclusion[] = [];
    const selections: CandidateSelection[] = [];
    const used = new Set<string>();
    const days: GeneratedDay[] = [];
    for (const [dayIndex, template] of WEEKLY_ROLE_TEMPLATES[input.frequency].entries()) {
        const selectedRoles = template.roles.slice(0, input.durationMinutes === 40 ? 3 : 5);
        const exercises: GeneratedExercise[] = [];
        for (const role of selectedRoles) {
            const exercise = selectExercise(role, dayIndex, candidates, input, used, exclusions, selections);
            if (!exercise) return {ok: false, code: 'NO_VALID_CANDIDATE', message: `Aucun exercice valide pour ${template.name} — ${role}. Ajuste l’équipement ou les exclusions.`, exclusions};
            exercises.push(exercise);
        }
        const warmupSteps = warmup(input.lowBackComfortWarmup, input.durationMinutes);
        const warmupSeconds = warmupSteps.reduce((sum, entry) => sum + entry.seconds, 0);
        let conditioningSeconds = input.durationMinutes === 40 ? 240 : 360;
        let duration = estimateGeneratedDay(exercises, warmupSeconds, conditioningSeconds, input.durationMinutes);
        const upper = input.durationMinutes * 66;
        const lower = input.durationMinutes * 54;
        if (duration.total > upper && exercises.at(-1)?.role === 'accessory') { exercises.pop(); duration = estimateGeneratedDay(exercises, warmupSeconds, conditioningSeconds, input.durationMinutes); }
        if (duration.total < lower) { conditioningSeconds += Math.min(600 - conditioningSeconds, lower - duration.total); duration = estimateGeneratedDay(exercises, warmupSeconds, conditioningSeconds, input.durationMinutes); }
        const warnings: string[] = [];
        if (duration.total < lower || duration.total > upper) warnings.push(`Durée hors tolérance : ${Math.round(duration.total / 60)} min.`);
        days.push({name: template.name, emphasis: template.emphasis, targetDurationMinutes: input.durationMinutes, warmup: warmupSteps, conditioning: {kind: 'low-impact', name: 'Vélo, marche inclinée ou traîneau selon disponibilité', seconds: conditioningSeconds}, exercises, duration, warnings});
    }
    const weeklyPatterns: Record<string, number> = {};
    const weeklyMuscles: Record<string, number> = {};
    for (const exercise of days.flatMap((day) => day.exercises)) {
        weeklyPatterns[exercise.movementPattern] = (weeklyPatterns[exercise.movementPattern] ?? 0) + exercise.prescription.workingSets;
        for (const muscle of exercise.primaryMuscles) weeklyMuscles[muscle] = (weeklyMuscles[muscle] ?? 0) + exercise.prescription.workingSets;
    }
    const warnings = days.flatMap((day) => day.warnings);
    if (warnings.length) return {ok: false, code: 'VALIDATION_FAILED', message: warnings.join(' '), exclusions};
    const explanation = {normalizedInput: input, selections, exclusions, warnings, weeklyPatterns, weeklyMuscles};
    const identityHash = stableHash(JSON.stringify({input, days, explanation}));
    return {ok: true, program: {name: `Programme ${input.frequency} jours · ${input.durationMinutes} min`, frequency: input.frequency, durationMinutes: input.durationMinutes, seed: input.seed, generatorVersion: input.generatorVersion, identityHash, days, explanation}};
}

export function regenerateAccessories(program: GeneratedProgram, input: GeneratorInput, candidates: GeneratorCandidate[]): GenerationResult {
    const protectedSnapshot = program.days.map((day) => day.exercises.filter((entry) => entry.role !== 'accessory' || entry.locked));
    const regenerated = generateProgram({...input, seed: `${input.seed}:accessories`}, candidates);
    if (!regenerated.ok) return regenerated;
    const days = regenerated.program.days.map((day, index) => ({...day, exercises: day.exercises.map((entry) => protectedSnapshot[index].find((protectedEntry) => protectedEntry.role === entry.role) ?? entry)}));
    const next = {...regenerated.program, days};
    return {ok: true, program: {...next, identityHash: stableHash(JSON.stringify(next))}};
}
