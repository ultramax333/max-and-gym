import {CandidateExclusion, GeneratorCandidate, GeneratorInput, GeneratorRole} from './types';

export interface ConstraintResult {allowed: boolean; exclusion?: CandidateExclusion}

function excludes(role: GeneratorRole | 'core', candidate: GeneratorCandidate, reasonCode: string, reason: string): ConstraintResult {
    return {allowed: false, exclusion: {exerciseId: candidate.id, role, reasonCode, reason}};
}

export function evaluateHardConstraints(candidate: GeneratorCandidate, input: GeneratorInput, role: GeneratorRole | 'core'): ConstraintResult {
    if (!candidate.generatorEligible || candidate.archived || !['reviewed', 'custom'].includes(candidate.contentStatus)) return excludes(role, candidate, 'NOT_REVIEWED_ELIGIBLE', 'Exercice non revu ou non éligible.');
    if (candidate.neverSuggest || candidate.effectiveNeverSuggest || input.neverSuggestExerciseIds.includes(candidate.id)) return excludes(role, candidate, 'NEVER_SUGGEST', 'Marqué « Jamais proposer ».');
    if (input.blockedExerciseIds.includes(candidate.id)) return excludes(role, candidate, 'EXERCISE_BLOCKED', 'Exercice bloqué explicitement.');
    const tags = [...candidate.impactTags, ...candidate.positionTags, ...candidate.transitionTags, ...candidate.setupTags];
    const blockedTag = tags.find((tag) => input.blockedTags.includes(tag));
    if (blockedTag) return excludes(role, candidate, 'TAG_BLOCKED', `Contrainte bloquante : ${blockedTag}.`);
    const hasEquipment = candidate.equipmentTags.includes('body only') || candidate.equipmentTags.some((tag) => input.equipment.includes(tag));
    if (!hasEquipment) return excludes(role, candidate, 'EQUIPMENT_UNAVAILABLE', 'Équipement indisponible.');
    return {allowed: true};
}

const contains = (candidate: GeneratorCandidate, expression: RegExp) => expression.test(candidate.name.toLowerCase());

export function matchesRole(candidate: GeneratorCandidate, role: GeneratorRole): boolean {
    switch (role) {
        case 'knee-dominant': return candidate.movementPattern === 'squat' && !contains(candidate, /calf/);
        case 'hinge': return candidate.movementPattern === 'hinge';
        case 'horizontal-push': return candidate.movementPattern === 'push' && contains(candidate, /bench|chest|floor press|dip/);
        case 'vertical-push': return candidate.movementPattern === 'push' && contains(candidate, /shoulder|overhead|arnold|military|kettlebell press|clean and press/);
        case 'vertical-pull': return candidate.movementPattern === 'pull' && contains(candidate, /pull-up|pulldown|chin/);
        case 'supported-pull': return candidate.movementPattern === 'pull' && contains(candidate, /row/);
        case 'posterior-assistance': return candidate.movementPattern === 'hinge' || candidate.primaryMuscles.some((muscle) => ['glutes', 'hamstrings'].includes(muscle));
        case 'leg-assistance': return candidate.movementPattern === 'squat' || candidate.primaryMuscles.some((muscle) => ['quadriceps', 'glutes'].includes(muscle));
        case 'accessory': return candidate.movementPattern === 'accessory';
    }
}
