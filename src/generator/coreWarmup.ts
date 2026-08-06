import {evaluateHardConstraints} from './constraints';
import {GeneratedCoreSession, GeneratorCandidate, GeneratorInput} from './types';

export function generateCoreSession(input: GeneratorInput, candidates: GeneratorCandidate[]): GeneratedCoreSession | undefined {
    const exclusions: GeneratedCoreSession['exclusions'] = [];
    const valid = candidates.filter((candidate) => {
        const result = evaluateHardConstraints(candidate, input, 'core');
        if (!result.allowed && result.exclusion) exclusions.push(result.exclusion);
        return result.allowed && candidate.movementPattern === 'core' && candidate.primaryMuscles.includes('abdominals');
    });
    const cluster = ['floor', 'standing-or-supported'].map((position) => ({position, items: valid.filter((entry) => entry.positionTags.includes(position)).sort((a, b) => a.id.localeCompare(b.id))})).sort((a, b) => b.items.length - a.items.length)[0];
    if (!cluster || cluster.items.length < 4) return undefined;
    const exercises = cluster.items.slice(0, input.coreMinutes === 10 ? 4 : 5);
    const rounds = input.coreMinutes === 10 ? 2 : 3;
    const transitions = exercises.length * rounds * 20;
    const workSeconds = Math.floor((input.coreMinutes * 60 - transitions) / (exercises.length * rounds));
    return {targetMinutes: input.coreMinutes, rounds, positionCluster: cluster.position, exercises: exercises.map((entry) => ({exerciseId: entry.id, name: entry.name, workSeconds, transitionSeconds: 20})), estimatedSeconds: (workSeconds + 20) * exercises.length * rounds, exclusions};
}
