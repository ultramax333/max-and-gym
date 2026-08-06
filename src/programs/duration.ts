import {ProgramDayDetail} from './types';

export interface DurationBreakdown {
    warmup: number;
    ramp: number;
    execution: number;
    rest: number;
    setup: number;
    transitions: number;
    conditioning: number;
    total: number;
    target: number;
    delta: number;
}

export function estimateProgramDay(day: ProgramDayDetail): DurationBreakdown {
    const exercises = day.exercises;
    const ramp = exercises.filter((entry) => entry.role === 'primary').length * 180;
    const execution = exercises.reduce((sum, entry) => sum + entry.prescription.workingSets * 40, 0);
    const rest = exercises.reduce((sum, entry) => sum + Math.max(0, entry.prescription.workingSets - 1) * entry.prescription.restSeconds, 0);
    const setup = exercises.length * 75;
    const groupedTransitions = exercises.slice(1).filter((entry, index) => entry.groupId && entry.groupId === exercises[index].groupId).length;
    const transitions = Math.max(0, exercises.length - 1) * 45 - groupedTransitions * 25;
    const target = day.targetDurationMinutes * 60;
    const total = day.warmupSeconds + ramp + execution + rest + setup + transitions + day.conditioningSeconds;
    return {warmup: day.warmupSeconds, ramp, execution, rest, setup, transitions, conditioning: day.conditioningSeconds, total, target, delta: total - target};
}

export function weeklyBalance(days: ProgramDayDetail[]): {patterns: Record<string, number>; muscles: Record<string, number>; warnings: string[]} {
    const patterns: Record<string, number> = {};
    const muscles: Record<string, number> = {};
    for (const exercise of days.flatMap((day) => day.exercises)) {
        patterns[exercise.movementPatternSnapshot] = (patterns[exercise.movementPatternSnapshot] ?? 0) + exercise.prescription.workingSets;
        for (const muscle of exercise.primaryMusclesSnapshot) muscles[muscle] = (muscles[muscle] ?? 0) + exercise.prescription.workingSets;
    }
    const warnings: string[] = [];
    if (!Object.keys(patterns).length) warnings.push('Ajoute des exercices pour analyser l’équilibre hebdomadaire.');
    if ((patterns.push ?? 0) > (patterns.pull ?? 0) * 2 && (patterns.push ?? 0) >= 6) warnings.push('Le volume de poussée dépasse nettement le volume de tirage.');
    if ((patterns['squat'] ?? 0) + (patterns['knee-dominant'] ?? 0) === 0 && Object.keys(patterns).length) warnings.push('Aucun mouvement dominant genou cette semaine.');
    return {patterns, muscles, warnings};
}
