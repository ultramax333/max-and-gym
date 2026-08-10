import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {root, writeAudit} from './lib/audit-utils.mjs';

const catalog = JSON.parse(await readFile(path.join(root, 'src', 'exerciseCatalog', 'reviewed-exercises.json'), 'utf8'));
const sourcePins = JSON.parse(await readFile(path.join(root, 'SOURCE_PINS.json'), 'utf8'));
const invalid = [];
const assets = [];
for (const exercise of catalog) {
    if (exercise.sourceRevision !== sourcePins.freeExerciseDb.commit || !exercise.sourceUrl || !exercise.license) invalid.push({id: exercise.id, problem: 'source-or-license'});
    for (const media of exercise.media.filter((entry) => entry.kind !== 'thumbnail')) {
        if (media.path.startsWith('/') || media.path.includes('://')) {
            invalid.push({id: exercise.id, problem: 'non-local-path'});
            continue;
        }
        try {
            const bytes = (await stat(path.join(root, 'public', media.path))).size;
            if (bytes === 0 || bytes > 1_500_000) invalid.push({id: exercise.id, problem: 'invalid-size'});
            else assets.push({path: media.path, bytes});
        } catch {
            invalid.push({id: exercise.id, problem: 'missing-file'});
        }
    }
}
const report = {generatedAt: new Date().toISOString(), reviewedExercises: catalog.length, assetCount: assets.length, totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), invalid};
await writeAudit('exercise-assets', report, '# Exercise media audit\n\nReviewed exercises: ' + catalog.length + '. Local images: ' + assets.length + '. Invalid: ' + invalid.length + '.\n');
if (catalog.length < 150 || catalog.length > 400 || invalid.length) process.exitCode = 1;
