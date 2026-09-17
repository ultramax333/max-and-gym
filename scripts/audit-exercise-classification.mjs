import {readJson, writeAudit} from './lib/audit-utils.mjs';
const catalog = await readJson('src/exerciseCatalog/reviewed-exercises.json');
const overrides = await readJson('data/exercise-classification-overrides.json');
const invalid = [];
const roleMuscles = {
    hinge: ['glutes', 'hamstrings', 'quadriceps', 'lower back'],
    squat: ['quadriceps', 'glutes', 'hamstrings'],
    push: ['chest', 'shoulders', 'triceps'],
    pull: ['middle back', 'lats', 'traps', 'shoulders', 'biceps'],
    core: ['abdominals'],
};
for (const entry of catalog) {
    const fail = problem => invalid.push({id:entry.id, problem});
    if (!entry.primaryMuscles.length || !entry.equipmentTags.length) fail('missing-primary-or-equipment');
    if (roleMuscles[entry.movementPattern] && !entry.primaryMuscles.some(m => roleMuscles[entry.movementPattern].includes(m))) fail('movement-muscle-mismatch');
    for (const [word, tag] of [['Cable','cable'],['Dumbbell','dumbbell'],['Barbell','barbell'],['Band','bands']]) {
        if (new RegExp(`\\b${word}s?\\b`, 'i').test(entry.name) && !entry.equipmentTags.includes(tag)) fail(`missing-named-equipment:${tag}`);
    }
    const override = overrides[entry.sourceId];
    for (const key of ['movementPattern','primaryMuscles','equipmentTags']) if (override?.[key] && JSON.stringify(entry[key]) !== JSON.stringify(override[key])) fail(`override-not-applied:${key}`);
}
const rows = catalog.map(e => ({id:e.id, name:e.name, primary:e.primaryMuscles, secondary:e.secondaryMuscles, focus:e.generatorFocusZones ?? [], equipment:e.equipmentTags, movement:e.movementPattern, eligible:e.generatorEligible && !e.archived, reviewReason:overrides[e.sourceId]?.reason ?? 'Pinned source retained; no confirmed metadata correction.'}));
await writeAudit('exercise-classification', {reviewedCount:catalog.length, overrideCount:Object.keys(overrides).length, invalid, rows},
    `# Exercise classification audit\n\n${catalog.length} records checked; ${Object.keys(overrides).length} reviewed overrides; ${invalid.length} invariant failures.\n\nThis checks metadata consistency, not individual medical suitability. Auxiliary stations are separately tested.\n\n| Exercise | Primary | Resistance | Movement |\n|---|---|---|---|\n${rows.map(e => `| ${e.name} | ${e.primary.join(', ')} | ${e.equipment.join(' + ')} | ${e.movement} |`).join('\n')}`);
if (invalid.length) { process.stdout.write(JSON.stringify(invalid, null, 2) + '\n'); process.exitCode = 1; }
else process.stdout.write(`Classification audit: ${catalog.length} records, ${Object.keys(overrides).length} overrides, no invariant failures.\n`);
