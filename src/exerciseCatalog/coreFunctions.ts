// Abdominal exercises all share `movementPattern: 'core'`, so the pattern cannot
// tell a crunch from a plank. This reviewed table adds the training function
// without a Dexie schema change; unlisted or custom exercises simply have none.
export type CoreFunction = 'flexion' | 'leg-raise' | 'rotation' | 'anti-rotation' | 'anti-extension';

export const CORE_FUNCTION_LABELS: Record<CoreFunction, string> = {
    flexion: 'flexion',
    'leg-raise': 'leg raise',
    rotation: 'rotation',
    'anti-rotation': 'anti-rotation',
    'anti-extension': 'anti-extension',
};

const CORE_FUNCTION_BY_SOURCE_ID: Record<string, CoreFunction> = {
    // Spinal flexion: crunch variants, loaded or machine-guided.
    Ab_Crunch_Machine: 'flexion', Cable_Crunch: 'flexion', Cable_Seated_Crunch: 'flexion', 'Crunch_-_Hands_Overhead': 'flexion',
    'Crunch_-_Legs_On_Exercise_Ball': 'flexion', Crunches: 'flexion', Decline_Crunch: 'flexion', Gorilla_Chin_Crunch: 'flexion',
    // Leg raise and lower abdomen: hip flexion with a posterior pelvic tilt.
    'Bent-Knee_Hip_Raise': 'leg-raise', Cable_Reverse_Crunch: 'leg-raise', Decline_Reverse_Crunch: 'leg-raise',
    'Flat_Bench_Leg_Pull-In': 'leg-raise', Flat_Bench_Lying_Leg_Raise: 'leg-raise', Hanging_Leg_Raise: 'leg-raise',
    Hanging_Pike: 'leg-raise', Knee_Hip_Raise_On_Parallel_Bars: 'leg-raise', 'Leg_Pull-In': 'leg-raise',
    Reverse_Crunch: 'leg-raise', Smith_Machine_Hip_Raise: 'leg-raise',
    // Rotation and obliques: twists, chops, side bends and diagonal crunches.
    Air_Bike: 'rotation', Alternate_Heel_Touchers: 'rotation', Bosu_Ball_Cable_Crunch_With_Side_Bends: 'rotation',
    Cable_Judo_Flip: 'rotation', Cable_Russian_Twists: 'rotation', 'Cross-Body_Crunch': 'rotation', Decline_Oblique_Crunch: 'rotation',
    Dumbbell_Side_Bend: 'rotation', Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists: 'rotation', Landmine_180s: 'rotation',
    'Oblique_Crunches_-_On_The_Floor': 'rotation', 'One-Arm_High-Pulley_Cable_Side_Bends': 'rotation', Russian_Twist: 'rotation',
    Standing_Cable_Lift: 'rotation', Standing_Cable_Wood_Chop: 'rotation',
    // Anti-rotation: resisting a twist.
    Pallof_Press: 'anti-rotation', Pallof_Press_With_Rotation: 'anti-rotation',
    // Anti-extension and bracing: resisting the lower back arching.
    Ab_Roller: 'anti-extension', 'Barbell_Ab_Rollout_-_On_Knees': 'anti-extension', Dead_Bug: 'anti-extension',
    Plank: 'anti-extension', Suspended_Fallout: 'anti-extension',
};

export function coreFunctionFor(exerciseId: string): CoreFunction | undefined {
    return CORE_FUNCTION_BY_SOURCE_ID[exerciseId.replace(/^fedb:/, '')];
}

// Round-robin over functions: the best entry of each function comes first (in the
// order of the input ranking), then the second best of each, and so on. A
// function is therefore never repeated before every other available function has
// appeared. Exercises without a function (custom ones) form one group of their own.
export function orderByCoreFunction<T>(ranked: T[], exerciseId: (entry: T) => string): T[] {
    const groups = new Map<string, T[]>();
    for (const entry of ranked) {
        const key = coreFunctionFor(exerciseId(entry)) ?? 'unclassified';
        groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    const ordered: T[] = [];
    for (let round = 0; ordered.length < ranked.length; round += 1) {
        const added = [...groups.values()].flatMap((group) => group[round] ? [group[round]] : []);
        // Keep the ranking inside a round, so the best-scored function still leads.
        added.sort((left, right) => ranked.indexOf(left) - ranked.indexOf(right));
        ordered.push(...added);
    }
    return ordered;
}
