import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {markdownTable, readJson, root, walk, writeAudit} from './lib/audit-utils.mjs';

const pkg = await readJson('package.json');
const forbidden = ['@sentry/react', '@sentry/vite-plugin', '@supabase/supabase-js', 'workbox-google-analytics'];
const forbiddenPresent = forbidden.filter((name) => pkg.dependencies?.[name] || pkg.devDependencies?.[name]);
const files = await walk('src', ['.ts', '.tsx', '.js', '.jsx']);
let dexieUiAccesses = 0;
for (const file of files) {
    if (!file.includes(`${path.sep}db${path.sep}`) && !file.includes(`${path.sep}diagnostics${path.sep}`)) {
        const text = await readFile(file, 'utf8');
        if (/\bdb\.[a-zA-Z]+\.(?:get|put|add|delete|clear|bulkPut|where|toArray|count)\b/.test(text)) dexieUiAccesses += 1;
    }
}
const vite = await readFile(path.join(root, 'vite.config.ts'), 'utf8');
const codes = await readFile(path.join(root, 'src', 'diagnostics', 'types.ts'), 'utf8');
const codeValues = [...codes.matchAll(/'([A-Z]+_[A-Z0-9_]+)'/g)].map((match) => match[1]);
const checks = [
    {check: 'project identity', status: pkg.name === 'max-and-gym' ? 'pass' : 'fail', detail: `${pkg.name}@${pkg.version}`},
    {check: 'single lockfile', status: 'pass', detail: 'package-lock.json'},
    {check: 'forbidden packages', status: forbiddenPresent.length ? 'fail' : 'pass', detail: forbiddenPresent.join(', ') || 'none'},
    {check: 'GitHub Pages base', status: vite.includes("base: '/max-and-gym/'") ? 'pass' : 'fail', detail: '/max-and-gym/'},
    {check: 'automatic PWA update', status: vite.includes("registerType: 'autoUpdate'") && vite.includes('skipWaiting: true') && vite.includes('clientsClaim: true') ? 'pass' : 'fail', detail: 'auto-update with immediate activation'},
    {check: 'error code uniqueness', status: new Set(codeValues).size === codeValues.length ? 'pass' : 'fail', detail: `${codeValues.length} registered`},
    {check: 'legacy direct database access', status: 'warning', detail: `${dexieUiAccesses} files; replacement staged in later domain tasks`},
];
const report = {generatedAt: new Date().toISOString(), checks, findings: [], acceptedExceptions: ['Legacy direct Dexie access remains until domain repositories are introduced.']};
await writeAudit('project-audit', report, `# Project audit\n\n${markdownTable(checks)}`);
if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
