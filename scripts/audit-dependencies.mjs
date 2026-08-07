import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {markdownTable, readJson, root, writeAudit} from './lib/audit-utils.mjs';

const pkg = await readJson('package.json');
const lock = await readJson('package-lock.json');
const rootLock = lock.packages?.[''] ?? {};
const allRoot = {...pkg.dependencies, ...pkg.devDependencies};
const missingFromLock = Object.keys(allRoot).filter((name) => !rootLock.dependencies?.[name] && !rootLock.devDependencies?.[name]);
const missingIntegrity = Object.entries(lock.packages ?? {}).filter(([name, meta]) => name && meta.resolved?.startsWith('https://registry.npmjs.org/') && !meta.integrity).map(([name]) => name);
const forbidden = ['@sentry/react', '@sentry/vite-plugin', '@supabase/supabase-js', 'workbox-google-analytics'].filter((name) => allRoot[name]);
const checks = [
    {check: 'lockfile version', status: lock.lockfileVersion === 3 ? 'pass' : 'fail', detail: String(lock.lockfileVersion)},
    {check: 'application version parity', status: pkg.version === lock.version && pkg.version === rootLock.version ? 'pass' : 'fail', detail: `${pkg.version} / ${lock.version} / ${rootLock.version}`},
    {check: 'root dependencies locked', status: missingFromLock.length ? 'fail' : 'pass', detail: missingFromLock.join(', ') || `${Object.keys(allRoot).length} dependencies`},
    {check: 'registry integrity hashes', status: missingIntegrity.length ? 'fail' : 'pass', detail: missingIntegrity.join(', ') || 'complete'},
    {check: 'forbidden network dependencies', status: forbidden.length ? 'fail' : 'pass', detail: forbidden.join(', ') || 'none'},
    {check: 'supported runtime', status: pkg.engines?.node === '>=24.0.0 <25' ? 'pass' : 'fail', detail: pkg.engines?.node ?? 'missing'},
    {check: 'browser acceptance runner', status: pkg.devDependencies?.['@playwright/test'] === '1.61.1' ? 'pass' : 'fail', detail: pkg.devDependencies?.['@playwright/test'] ?? 'missing'},
];
await writeAudit('dependency-audit', {generatedAt: new Date().toISOString(), checks, packageCount: Object.keys(lock.packages ?? {}).length - 1, externalAdvisoryGate: 'npm audit --omit=dev --audit-level=high in GitHub Actions'}, `# Dependency audit\n\n${markdownTable(checks)}\n\nThe advisory database gate runs in CI because it requires the npm registry.\n`);
if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
