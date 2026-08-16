import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const revision = 'b0eed061e1c8';
const sourceFile = path.join(root, 'data', 'upstream', `free-exercise-db-${revision}.json`);
const outputFile = path.join(root, 'src', 'exerciseCatalog', 'reviewed-exercises.json');
const reportFile = path.join(root, 'docs', 'reports', 'generated', '04-curation-summary.json');
const supportedEquipment = new Set(['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other']);
const excluded = /(burpee|bunny|rapid.*floor|rapid.*plank|high.*impact.*transition)/i;
const priority = /(squat|deadlift|row|press|curl|extension|raise|pull|lat|lunge|leg|calf|fly|crunch|plank|carry|sled|hip|glute|hamstring|abdominal|back|shoulder|triceps|biceps|machine|cable)/i;
const curatedExpansionNames = new Set([
    // Arms: distinct loading profiles, grips and useful machine/cable options.
    'Machine Bicep Curl', 'Machine Preacher Curls', 'One Arm Dumbbell Preacher Curl', 'Overhead Cable Curl', 'Preacher Curl',
    'Reverse Barbell Curl', 'Reverse Cable Curl', 'Seated Dumbbell Curl', 'Standing One-Arm Cable Curl', 'Zottman Curl',
    'Band Skull Crusher', 'Bench Dips', 'JM Press', 'Kneeling Cable Triceps Extension', 'Machine Triceps Extension',
    'Reverse Grip Triceps Pushdown', 'Seated Triceps Press', 'Smith Machine Close-Grip Bench Press', 'Tate Press',
    'Tricep Dumbbell Kickback', 'Triceps Overhead Extension with Rope', 'Triceps Pushdown - Rope Attachment',
    'Dumbbell Lying Pronation', 'Dumbbell Lying Supination', 'Plate Pinch', 'Palms-Up Dumbbell Wrist Curl Over A Bench',
    'Palms-Down Dumbbell Wrist Curl Over A Bench', 'Wrist Roller',
    // Chest and shoulders: machine, cable, unilateral and joint-preparation choices.
    'Dips - Chest Version', 'Incline Dumbbell Bench With Palms Facing In', 'Low Cable Crossover', 'Leverage Chest Press',
    'Machine Bench Press', 'One Arm Dumbbell Bench Press', 'One-Arm Kettlebell Floor Press', 'Pushups',
    'Push-Ups With Feet Elevated', 'Smith Machine Bench Press', 'Smith Machine Incline Bench Press', 'Standing Cable Chest Press',
    'Dumbbell Scaption', 'External Rotation', 'External Rotation with Band', 'Internal Rotation with Band', 'Kettlebell Arnold Press',
    'Lateral Raise - With Bands', 'Leverage Shoulder Press', 'Lying Rear Delt Raise', 'Machine Shoulder (Military) Press',
    'Reverse Flyes', 'Reverse Machine Flyes', 'Seated Dumbbell Press', 'Seated Side Lateral Raise', 'Side Lateral Raise',
    'Standing Military Press', 'Standing Palm-In One-Arm Dumbbell Press',
    // Back and traps: vertical/horizontal pulls with practical commercial-gym substitutions.
    'Chin-Up', 'Kneeling High Pulley Row', 'Kneeling Single-Arm High Pulley Row', 'Leverage Iso Row', 'One Arm Lat Pulldown',
    'Pullups', 'Rope Straight-Arm Pulldown', 'Straight-Arm Pulldown', 'Underhand Cable Pulldowns', 'V-Bar Pulldown',
    'Weighted Pull Ups', 'Wide-Grip Lat Pulldown', 'Leverage High Row', 'One-Arm Dumbbell Row', 'Seated Cable Rows',
    'T-Bar Row with Handle', 'Suspended Row', 'Barbell Shrug', 'Dumbbell Shrug', 'Leverage Shrug',
    // Lower body: machines, unilateral work and distinct posterior-chain patterns.
    'Barbell Hip Thrust', 'Barbell Step Ups', 'Dumbbell Step Ups', 'Leg Extensions', 'Leg Press', 'Narrow Stance Leg Press',
    'Single-Leg Leg Extension', 'Smith Machine Squat', 'Split Squat with Dumbbells', 'Trap Bar Deadlift', 'Wide Stance Barbell Squat',
    'Kettlebell One-Legged Deadlift', 'Lying Leg Curls', 'Natural Glute Ham Raise', 'Platform Hamstring Slides',
    'Romanian Deadlift', 'Seated Band Hamstring Curl', 'Seated Leg Curl', 'Standing Leg Curl',
    'Butt Lift (Bridge)', 'One-Legged Cable Kickback', 'Pull Through', 'Single Leg Glute Bridge', 'Step-up with Knee Raise',
    'Seated Calf Raise', 'Standing Calf Raises', 'Thigh Adductor', 'Thigh Abductor', 'Monster Walk',
    // Core: anti-rotation, flexion, stability and loaded options without cosmetic duplicates.
    'Ab Roller', 'Air Bike', 'Alternate Heel Touchers', 'Barbell Ab Rollout - On Knees', 'Dead Bug', 'Dumbbell Side Bend',
    'Hanging Pike', 'Knee/Hip Raise On Parallel Bars', "Landmine 180's", 'Leg Pull-In', 'Pallof Press',
    'Pallof Press With Rotation', 'Plank', 'Reverse Crunch', 'Russian Twist', 'Side Bridge', 'Standing Cable Wood Chop',
]);

// These records remain browsable and keep their stable IDs for saved workouts,
// but the generic rep-based generator must not select them automatically.
const generatorExcludedIds = new Set([
    // Mobility, timed holds, grip holds, or undeclared specialist equipment.
    '90_90_Hamstring', 'Chair_Leg_Extended_Stretch', 'Chest_And_Front_Of_Shoulder_Stretch', 'Front_Leg_Raises',
    'Hip_Circles_prone', 'Intermediate_Hip_Flexor_and_Quad_Stretch', 'Plank', 'Side_Bridge', 'Plate_Pinch',
    'Bosu_Ball_Cable_Crunch_With_Side_Bends', 'Crunch_-_Legs_On_Exercise_Ball',
    // Technical, explosive, atypical, or needlessly risky for a general-purpose generator.
    'Barbell_Guillotine_Bench_Press', 'Anti-Gravity_Press', 'Bent_Press', 'Bradford_Rocky_Presses',
    'Clean_and_Press', 'Double_Kettlebell_Push_Press', 'Box_Squat_with_Chains', 'Freehand_Jump_Squat',
    // Minor variants kept for manual selection while canonical versions remain eligible.
    'Barbell_Full_Squat', 'Front_Barbell_Squat_To_A_Bench', 'Dumbbell_Squat_To_A_Bench',
    'Front_Two-Dumbbell_Raise', 'Incline_Dumbbell_Flyes_-_With_A_Twist', 'Cable_Iron_Cross',
    'Cable_Rope_Overhead_Triceps_Extension', 'Rope_Straight-Arm_Pulldown', 'Alternate_Incline_Dumbbell_Curl',
    'Dumbbell_Alternate_Bicep_Curl',
]);

// Redundant variants are hidden from the active library, while their records and
// stable IDs remain in IndexedDB so old programs and workout history still resolve.
const libraryArchivedIds = new Set([
    'Barbell_Full_Squat', 'Front_Barbell_Squat_To_A_Bench', 'Dumbbell_Squat_To_A_Bench',
    'Front_Two-Dumbbell_Raise', 'Incline_Dumbbell_Flyes_-_With_A_Twist', 'Cable_Iron_Cross',
    'Cable_Rope_Overhead_Triceps_Extension', 'Rope_Straight-Arm_Pulldown', 'Alternate_Incline_Dumbbell_Curl',
    'Dumbbell_Alternate_Bicep_Curl',
]);

// These compound lifts materially train glutes even though the pinned source
// correctly lists another muscle as primary. The opt-in list keeps focused
// generation useful without admitting every exercise with incidental glute work.
const generatorFocusZones = new Map([
    ['Romanian Deadlift', ['glutes']],
    ['Split Squat with Dumbbells', ['glutes']],
    ['Dumbbell Rear Lunge', ['glutes']],
    ['Kettlebell One-Legged Deadlift', ['glutes']],
    ['Wide Stance Barbell Squat', ['glutes']],
    ['Leg Press', ['glutes']],
]);

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function category(value) {
    if (value === 'cardio') return 'conditioning';
    if (value === 'stretching') return 'mobility';
    return 'strength';
}

function movementPattern(entry) {
    const lower = entry.name.toLowerCase();
    if ((entry.primaryMuscles ?? []).includes('abdominals')) return 'core';
    if (/(squat|lunge|leg press|step[ -]?ups?)/.test(lower)) return 'squat';
    if (/(deadlift|good morning|hip thrust|glute|butt lift|hip lift|hip extension|kickback|pull through)/.test(lower)) return 'hinge';
    if (/(row|pull[ -]?ups?|pullups?|pulldown|chin[ -]?ups?|bench pull)/.test(lower)) return 'pull';
    if (/(press|push-up|dip)/.test(lower)) return 'push';
    if (/(carry|walk)/.test(lower)) return 'carry';
    return 'accessory';
}

function metricType(equipment) {
    return equipment === 'body only' ? 'bodyweight-reps' : 'weight-reps';
}

function buildExercise(entry) {
    const asset = slug(entry.id);
    const instructions = (entry.instructions ?? []).map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return {
        id: `fedb:${entry.id}`,
        source: 'free-exercise-db',
        sourceId: entry.id,
        sourceRevision: revision,
        name: entry.name.trim(),
        aliases: [entry.id.replaceAll('_', ' ')],
        category: category(entry.category),
        force: entry.force ?? 'mixed',
        mechanic: entry.mechanic ?? 'compound',
        equipmentTags: [entry.equipment ?? 'other'],
        primaryMuscles: entry.primaryMuscles ?? [],
        secondaryMuscles: entry.secondaryMuscles ?? [],
        ...(generatorFocusZones.has(entry.name) ? {generatorFocusZones: generatorFocusZones.get(entry.name)} : {}),
        movementPattern: movementPattern(entry),
        positionTags: /plank|floor|sit-up|crunch/i.test(entry.name) ? ['floor'] : ['standing-or-supported'],
        transitionTags: /jump|burpee/i.test(entry.name) ? ['high-impact-transition'] : [],
        impactTags: /jump/i.test(entry.name) ? ['high-impact'] : [],
        setupTags: [entry.equipment ?? 'other'],
        metricType: metricType(entry.equipment),
        defaultRestSeconds: entry.category === 'cardio' ? 30 : 75,
        defaultRepRange: {min: entry.category === 'cardio' ? 12 : 8, max: entry.category === 'cardio' ? 20 : 12},
        defaultRirRange: {min: 1, max: 3},
        contentStatus: 'reviewed',
        generatorEligible: !excluded.test(entry.name) && !generatorExcludedIds.has(entry.id),
        neverSuggest: false,
        archived: libraryArchivedIds.has(entry.id),
        setupInstructions: instructions[0] ?? 'Set up with controlled posture and a stable range of motion.',
        executionSteps: instructions.slice(1, 5),
        breathingCue: 'Breathe steadily; exhale through the effort.',
        commonMistakes: ['Rushing repetitions', 'Losing a stable trunk position'],
        sourceName: 'Free Exercise DB',
        sourceUrl: `https://github.com/yuhonas/free-exercise-db/blob/${revision}/exercises/${entry.id}.json`,
        license: 'Unlicense',
        media: [
            {kind: 'start-image', path: `media/exercises/${asset}-0.jpg`, altText: `${entry.name} starting position`},
            {kind: 'end-image', path: `media/exercises/${asset}-1.jpg`, altText: `${entry.name} finishing position`},
            {kind: 'thumbnail', path: `media/exercises/${asset}-0.jpg`, altText: `${entry.name} thumbnail`},
        ],
    };
}

const raw = JSON.parse(await readFile(sourceFile, 'utf8'));
const candidates = raw.filter((entry) => supportedEquipment.has(entry.equipment) && (['strength', 'cardio', 'stretching'].includes(entry.category) || curatedExpansionNames.has(entry.name)) && !excluded.test(entry.name) && Array.isArray(entry.images) && entry.images.length >= 2);
const initialEntries = candidates
    .filter((entry) => !curatedExpansionNames.has(entry.name))
    .map((entry) => ({entry, score: priority.test(entry.name) ? 0 : 1}))
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, 180)
    .map(({entry}) => entry);
const initialIds = new Set(initialEntries.map((entry) => entry.id));
const expansionEntries = candidates
    .filter((entry) => curatedExpansionNames.has(entry.name) && !initialIds.has(entry.id))
    .sort((a, b) => a.name.localeCompare(b.name));
const missingExpansionNames = [...curatedExpansionNames].filter((name) => !expansionEntries.some((entry) => entry.name === name));
if (missingExpansionNames.length > 0 || expansionEntries.length !== curatedExpansionNames.size) {
    throw new Error(`Curated expansion mismatch: ${missingExpansionNames.join(', ')}`);
}
const reviewed = [...initialEntries, ...expansionEntries].map((entry) => buildExercise(entry));
const duplicateNames = reviewed.filter((entry, index) => reviewed.findIndex((other) => other.name.toLowerCase() === entry.name.toLowerCase()) !== index);
if (reviewed.length !== 302 || duplicateNames.length > 0 || reviewed.some((entry) => !entry.sourceUrl || entry.media.length < 2)) throw new Error('Curated exercise catalogue validation failed.');
await mkdir(path.dirname(outputFile), {recursive: true});
await mkdir(path.dirname(reportFile), {recursive: true});
await writeFile(outputFile, JSON.stringify(reviewed, null, 2) + '\n');
await writeFile(reportFile, JSON.stringify({
    source: 'Free Exercise DB',
    revision,
    sourceCount: raw.length,
    reviewedCount: reviewed.length,
    generatorEligibleCount: reviewed.filter((entry) => entry.generatorEligible).length,
    curatedExpansionCount: expansionEntries.length,
    excludedCount: raw.length - candidates.length,
    duplicateNames: duplicateNames.map((entry) => entry.name),
    generatedAt: new Date().toISOString(),
}, null, 2) + '\n');
process.stdout.write(`Generated ${reviewed.length} reviewed exercises from ${raw.length} source records.\n`);
