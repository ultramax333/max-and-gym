// Station metadata is separate from generator availability tags: a bench does
// not replace the dumbbells or cable required to perform an exercise.
export const EQUIPMENT_STATIONS = {
    bench: {label: 'Bench', color: '#BBA8FF'},
    dumbbell: {label: 'Dumbbells', color: '#73BFFF'},
    barbell: {label: 'Barbells', color: '#FFB578'},
    cable: {label: 'Cables', color: '#62DAC7'},
    machine: {label: 'Machines', color: '#F4A6D3'},
    bodyweight: {label: 'Bodyweight', color: '#CEDC86'},
    bands: {label: 'Bands', color: '#FFE083'},
    kettlebell: {label: 'Kettlebells', color: '#9BC9E7'},
    preacher: {label: 'Preacher bench', color: '#D4B3EF'},
    other: {label: 'Other equipment', color: '#C1CAD6'},
} as const;
export type EquipmentStation = keyof typeof EQUIPMENT_STATIONS;
export interface EquipmentExercise {
    exerciseId: string;
    equipmentTags?: string[];
    equipmentStation?: EquipmentStation;
    groupId?: string;
    groupSequenceIndex?: number;
}

// Reviewed catalogue IDs, not a name search: e.g. Machine Bench Press stays
// at a machine and a floor press is not assigned a bench.
const benchExercises = new Set([
    'Alternate_Incline_Dumbbell_Curl', 'Anti-Gravity_Press', 'Arnold_Dumbbell_Press',
    'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Curls_Lying_Against_An_Incline',
    'Barbell_Guillotine_Bench_Press', 'Barbell_Incline_Bench_Press_-_Medium_Grip',
    'Barbell_Incline_Shoulder_Raise', 'Barbell_Seated_Calf_Raise',
    'Bench_Press_-_With_Bands', 'Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench',
    'Bent-Arm_Barbell_Pullover', 'Bent-Arm_Dumbbell_Pullover',
    'Barbell_Shoulder_Press', 'Bradford_Rocky_Presses', 'Cable_Seated_Crunch', 'Cable_Wrist_Curl',
    'Dumbbell_Squat_To_A_Bench', 'Band_Skull_Crusher', 'Seated_Band_Hamstring_Curl', 'Tate_Press',
    'Hyperextensions_With_No_Hyperextension_Bench',
    'Cable_Incline_Pushdown', 'Cable_Incline_Triceps_Extension', 'Cable_Lying_Triceps_Extension',
    'Cable_Seated_Lateral_Raise', 'Close-Grip_Barbell_Bench_Press', 'Close-Grip_Dumbbell_Press',
    'Concentration_Curls', 'Decline_Barbell_Bench_Press', 'Decline_Crunch',
    'Decline_Dumbbell_Bench_Press', 'Decline_Dumbbell_Flyes', 'Decline_Dumbbell_Triceps_Extension',
    'Decline_EZ_Bar_Triceps_Extension', 'Decline_Oblique_Crunch', 'Decline_Reverse_Crunch',
    'Dumbbell_Bench_Press', 'Dumbbell_Bench_Press_with_Neutral_Grip', 'Dumbbell_Flyes',
    'Dumbbell_Incline_Row', 'Dumbbell_Incline_Shoulder_Raise',
    'Dumbbell_Lying_One-Arm_Rear_Lateral_Raise', 'Dumbbell_Lying_Rear_Lateral_Raise',
    'Dumbbell_Prone_Incline_Curl', 'Dumbbell_Seated_One-Leg_Calf_Raise',
    'Dumbbell_Shoulder_Press', 'Dumbbell_Tricep_Extension_-Pronated_Grip',
    'Flat_Bench_Cable_Flyes', 'Flat_Bench_Leg_Pull-In', 'Flat_Bench_Lying_Leg_Raise',
    'Flexor_Incline_Dumbbell_Curls', 'Front_Incline_Dumbbell_Raise', 'Front_Raise_And_Pullover',
    'Hammer_Grip_Incline_DB_Bench_Press', 'Incline_Barbell_Triceps_Extension', 'Incline_Bench_Pull',
    'Incline_Cable_Flye', 'Incline_Dumbbell_Curl',
    'Incline_Dumbbell_Flyes', 'Incline_Dumbbell_Flyes_-_With_A_Twist', 'Incline_Dumbbell_Press',
    'Incline_Hammer_Curls', 'Incline_Inner_Biceps_Curl', 'Barbell_Hip_Thrust', 'Bench_Dips',
    'Dumbbell_Lying_Pronation', 'Dumbbell_Lying_Supination', 'External_Rotation',
    'Incline_Dumbbell_Bench_With_Palms_Facing_In', 'JM_Press', 'Kneeling_Cable_Triceps_Extension',
    'Lying_Rear_Delt_Raise', 'One_Arm_Dumbbell_Bench_Press', 'One-Arm_Dumbbell_Row',
    'Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench', 'Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench',
    'Reverse_Flyes', 'Seated_Dumbbell_Curl', 'Seated_Dumbbell_Press', 'Seated_Side_Lateral_Raise',
    'Seated_Triceps_Press',
].map((id) => `fedb:${id}`));

function stationForTag(tag: string): EquipmentStation {
    switch (tag.trim().toLowerCase()) {
        case 'bench': return 'bench';
        case 'dumbbell': case 'dumbbells': return 'dumbbell';
        case 'barbell': case 'ez bar': return 'barbell';
        case 'cable': case 'cables': return 'cable';
        case 'machine': return 'machine';
        case 'body only': case 'bodyweight': return 'bodyweight';
        case 'bands': case 'band': return 'bands';
        case 'kettlebells': case 'kettlebell': return 'kettlebell';
        default: return 'other';
    }
}

export function requiredStations(exercise: EquipmentExercise): EquipmentStation[] {
    const stations = [...new Set((exercise.equipmentTags ?? []).filter((tag) => tag.trim()).map(stationForTag))];
    if (benchExercises.has(exercise.exerciseId) && !stations.includes('bench')) stations.unshift('bench');
    if (['fedb:Preacher_Curl', 'fedb:One_Arm_Dumbbell_Preacher_Curl', 'fedb:Cable_Preacher_Curl'].includes(exercise.exerciseId)) stations.unshift('preacher');
    return stations.length ? stations : ['other'];
}

export function equipmentStation(exercise: EquipmentExercise): EquipmentStation {
    return exercise.equipmentStation && Object.hasOwn(EQUIPMENT_STATIONS, exercise.equipmentStation) ? exercise.equipmentStation : requiredStations(exercise)[0];
}

export function availableStations(exercises: EquipmentExercise[]): EquipmentStation[] {
    return [...new Set(exercises.flatMap(requiredStations))];
}

// Move whole execution groups; never split or internally reorder a superset.
// Every exercise occurs once, even when it requires several pieces of equipment.
export function orderByEquipment<T extends EquipmentExercise>(exercises: T[], requestedOrder: EquipmentStation[]): Array<T & {equipmentStation: EquipmentStation}> {
    const order = [...new Set([...requestedOrder, ...availableStations(exercises)])];
    const blocks: T[][] = [];
    const groups = new Map<string, T[]>();
    for (const exercise of exercises) {
        const group = exercise.groupId && groups.get(exercise.groupId);
        if (group) group.push(exercise);
        else {
            const block = [exercise];
            blocks.push(block);
            if (exercise.groupId) groups.set(exercise.groupId, block);
        }
    }
    return blocks.map((block, index) => {
        const required = new Set(block.flatMap(requiredStations));
        const station = order.find((entry) => required.has(entry)) ?? 'other';
        return {block, index, station};
    }).sort((a, b) => order.indexOf(a.station) - order.indexOf(b.station) || a.index - b.index)
        .flatMap(({block, station}) => [...block].sort((a, b) => (a.groupSequenceIndex ?? 0) - (b.groupSequenceIndex ?? 0))
            .map((exercise) => ({...exercise, equipmentStation: station})));
}
