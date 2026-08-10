import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {markdownTable, readJson, root, writeAudit} from './lib/audit-utils.mjs';

const report = await readJson('artifacts/bundle-report.json');
const html = await readFile(path.join(root, 'build/index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+src="([^"]+\/assets\/index-[^"]+\.js)"/);
if (!entryMatch) throw new Error('Unable to identify the production entry chunk');
const entryPath = entryMatch[1].split('/assets/')[1];
const entry = report.files.find((file) => file.path === `assets/${entryPath}`);
if (!entry) throw new Error('Production entry chunk is absent from bundle report');
const javascript = report.files.filter((file) => file.path.endsWith('.js'));
const exerciseDataChunks = javascript.filter((file) => file.path.includes('exercises-') || file.path.includes('ExerciseCatalogRepository-'));
const largestRoute = javascript.filter((file) => file.path !== entry.path && !exerciseDataChunks.includes(file)).sort((a, b) => b.bytes - a.bytes)[0];
const cp7EntryBytes = 2_124_140;
const reduction = 1 - entry.bytes / cp7EntryBytes;
const checks = [
    {check: 'initial JavaScript', status: entry.bytes <= 700_000 ? 'pass' : 'fail', detail: `${entry.bytes} bytes`},
    {check: 'CP7 entry reduction', status: reduction >= 0.6 ? 'pass' : 'fail', detail: `${(reduction * 100).toFixed(1)}%`},
    {check: 'largest non-data route chunk', status: largestRoute.bytes <= 500_000 ? 'pass' : 'fail', detail: `${largestRoute.path}: ${largestRoute.bytes} bytes`},
    {check: 'reviewed exercise data chunks', status: exerciseDataChunks.every((file) => file.bytes <= 900_000) ? 'pass' : 'fail', detail: 'lazy and each below 900000 bytes'},
];
await writeAudit('performance-audit', {generatedAt: new Date().toISOString(), baseline: {cp7EntryBytes}, entry, largestRoute, totalBytes: report.totalBytes, checks}, `# Bundle and performance audit\n\n${markdownTable(checks)}\n\nThe full artifact includes local reviewed exercise media and install splash assets; those bytes are not part of the initial route transfer.\n`);
if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
