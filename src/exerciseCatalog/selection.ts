import type {GeneratorCandidate} from '../generator/types';

export type QuickSessionZone = 'full-body' | 'upper-body' | 'lower-body' | 'chest' | 'back' | 'shoulders' | 'arms' | 'glutes' | 'core';
export const QUICK_SESSION_ZONES: Array<{value: QuickSessionZone; label: string; muscles: string[]}> = [
    {value: 'full-body', label: 'Full body', muscles: []},
    {value: 'upper-body', label: 'Upper body', muscles: ['chest', 'shoulders', 'middle back', 'lats', 'biceps', 'triceps', 'forearms', 'traps']},
    {value: 'lower-body', label: 'Lower body', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors']},
    {value: 'chest', label: 'Chest', muscles: ['chest']},
    {value: 'back', label: 'Back', muscles: ['middle back', 'lats', 'lower back', 'traps']},
    {value: 'shoulders', label: 'Shoulders', muscles: ['shoulders']},
    {value: 'arms', label: 'Arms', muscles: ['biceps', 'triceps', 'forearms']},
    {value: 'glutes', label: 'Glutes', muscles: ['glutes', 'abductors']},
    {value: 'core', label: 'Core', muscles: ['abdominals']},
];

type Target = Pick<GeneratorCandidate, 'primaryMuscles' | 'generatorFocusZones'>;
export function matchesQuickSessionZone(candidate: Target, zone: string): boolean {
    const definition = QUICK_SESSION_ZONES.find(entry => entry.value === zone);
    return Boolean(definition && (!definition.muscles.length || candidate.primaryMuscles.some(m => definition.muscles.includes(m)) || candidate.generatorFocusZones?.includes(zone)));
}

export interface SelectionConstraints {
    equipment?: string[];
    blockedExerciseIds?: string[];
    blockedTags?: string[];
}
export const HARD_EXCLUSION_TAGS = ['bunny-jump', 'burpee-like', 'plank-to-stand', 'rapid-floor-to-standing', 'high-impact-ground-transition', 'high-impact-transition', 'high-impact'];

// Resistance tags are cumulative requirements, not interchangeable setups.
// Auxiliary stations (bench, pull-up bar, etc.) are separately shown at setup.
export function hasAvailableEquipment(candidate: Pick<GeneratorCandidate, 'equipmentTags'>, equipment: string[]): boolean {
    return candidate.equipmentTags.length > 0 && candidate.equipmentTags.every(tag => equipment.includes(tag));
}

export function isSelectionEligible(candidate: GeneratorCandidate, constraints: SelectionConstraints = {}): boolean {
    const tags = [...candidate.impactTags, ...candidate.positionTags, ...candidate.transitionTags, ...candidate.setupTags];
    return candidate.generatorEligible && !candidate.archived && ['reviewed', 'custom'].includes(candidate.contentStatus)
        && !candidate.neverSuggest && !candidate.effectiveNeverSuggest
        && !constraints.blockedExerciseIds?.includes(candidate.id)
        && !tags.some(tag => HARD_EXCLUSION_TAGS.includes(tag) || constraints.blockedTags?.includes(tag))
        && (constraints.equipment === undefined || hasAvailableEquipment(candidate, constraints.equipment));
}

function targets(candidate: Target): string[] {
    return [...candidate.primaryMuscles, ...(candidate.generatorFocusZones ?? []).flatMap(zone => QUICK_SESSION_ZONES.find(entry => entry.value === zone)?.muscles ?? [])];
}

export interface AlternativeOptions extends SelectionConstraints {
    zone?: string;
    selectedIds?: Iterable<string>;
    preferredIds?: string[];
    limit?: number;
}

export function selectExerciseAlternatives<T extends GeneratorCandidate>(candidates: T[], current: Target & {id: string; movementPattern: string}, options: AlternativeOptions = {}): T[] {
    const selected = new Set(options.selectedIds);
    const currentTargets = targets(current);
    // A focused session may offer other movements for that same focus. Broad or
    // legacy sessions retain this exercise's target, not merely its pattern.
    const focused = options.zone && !['full-body', 'upper-body', 'lower-body'].includes(options.zone);
    const preferred = options.preferredIds ?? [];
    return candidates.filter(entry => entry.id !== current.id && !selected.has(entry.id) && isSelectionEligible(entry, options)
        && (!options.zone || matchesQuickSessionZone(entry, options.zone))
        && (focused || targets(entry).some(m => currentTargets.includes(m))))
        .sort((a, b) => {
            const rank = (e: T) => {
                const index = preferred.indexOf(e.id);
                return index < 0 ? preferred.length : index;
            };
            return rank(a) - rank(b) || Number(b.movementPattern === current.movementPattern) - Number(a.movementPattern === current.movementPattern)
                || Number(Boolean(b.favourite)) - Number(Boolean(a.favourite)) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
        }).slice(0, options.limit ?? 40);
}
