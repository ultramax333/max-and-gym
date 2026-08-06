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

function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function category(value) {
    if (value === 'cardio') return 'conditioning';
    if (value === 'stretching') return 'mobility';
    return 'strength';
}

function movementPattern(name) {
    const lower = name.toLowerCase();
    if (/(squat|lunge|leg press|step-up)/.test(lower)) return 'squat';
    if (/(deadlift|good morning|hip thrust|glute)/.test(lower)) return 'hinge';
    if (/(row|pull-up|pulldown|chin-up)/.test(lower)) return 'pull';
    if (/(press|push-up|dip)/.test(lower)) return 'push';
    if (/(carry|walk)/.test(lower)) return 'carry';
    if (/(crunch|plank|sit-up|ab)/.test(lower)) return 'core';
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
        movementPattern: movementPattern(entry.name),
        positionTags: /plank|floor|sit-up|crunch/i.test(entry.name) ? ['floor'] : ['standing-or-supported'],
        transitionTags: /jump|burpee/i.test(entry.name) ? ['high-impact-transition'] : [],
        impactTags: /jump/i.test(entry.name) ? ['high-impact'] : [],
        setupTags: [entry.equipment ?? 'other'],
        metricType: metricType(entry.equipment),
        defaultRestSeconds: entry.category === 'cardio' ? 30 : 75,
        defaultRepRange: {min: entry.category === 'cardio' ? 12 : 8, max: entry.category === 'cardio' ? 20 : 12},
        defaultRirRange: {min: 1, max: 3},
        contentStatus: 'reviewed',
        generatorEligible: !excluded.test(entry.name),
        neverSuggest: false,
        archived: false,
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
const candidates = raw.filter((entry) => supportedEquipment.has(entry.equipment) && ['strength', 'cardio', 'stretching'].includes(entry.category) && !excluded.test(entry.name) && Array.isArray(entry.images) && entry.images.length >= 2);
const reviewed = candidates
    .map((entry) => ({entry, score: priority.test(entry.name) ? 0 : 1}))
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, 180)
    .map(({entry}) => buildExercise(entry));
const duplicateNames = reviewed.filter((entry, index) => reviewed.findIndex((other) => other.name.toLowerCase() === entry.name.toLowerCase()) !== index);
if (reviewed.length < 150 || duplicateNames.length > 0 || reviewed.some((entry) => !entry.sourceUrl || entry.media.length < 2)) throw new Error('Curated exercise catalogue validation failed.');
await mkdir(path.dirname(outputFile), {recursive: true});
await mkdir(path.dirname(reportFile), {recursive: true});
await writeFile(outputFile, JSON.stringify(reviewed, null, 2) + '\n');
await writeFile(reportFile, JSON.stringify({
    source: 'Free Exercise DB',
    revision,
    sourceCount: raw.length,
    reviewedCount: reviewed.length,
    generatorEligibleCount: reviewed.filter((entry) => entry.generatorEligible).length,
    excludedCount: raw.length - candidates.length,
    duplicateNames: duplicateNames.map((entry) => entry.name),
    generatedAt: new Date().toISOString(),
}, null, 2) + '\n');
process.stdout.write(`Generated ${reviewed.length} reviewed exercises from ${raw.length} source records.\n`);
