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
    const ramp = exercises.reduce((sum, entry) => sum + (entry.prescription.warmupSets === undefined ? (entry.role === 'primary' ? 180 : 0) : entry.prescription.warmupSets * 45), 0);
    const execution = exercises.reduce((sum, entry) => sum + (entry.prescription.workingSets + (entry.prescription.warmupSets ?? 0) + (entry.prescription.dropSets ?? 0)) * 40, 0);
    const rest = exercises.reduce((sum, entry) => sum + Math.max(0, entry.prescription.workingSets + (entry.prescription.dropSets ?? 0) - 1) * entry.prescription.restSeconds, 0);
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
    if (!Object.keys(patterns).length) warnings.push('Add exercises to analyse weekly balance.');
    if ((patterns.push ?? 0) > (patterns.pull ?? 0) * 2 && (patterns.push ?? 0) >= 6) warnings.push('Push volume is substantially higher than pull volume.');
    if ((patterns['squat'] ?? 0) + (patterns['knee-dominant'] ?? 0) === 0 && Object.keys(patterns).length) warnings.push('No knee-dominant movement this week.');
    return {patterns, muscles, warnings};
}
