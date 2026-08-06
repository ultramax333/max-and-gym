import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {markdownTable, root, walk, writeAudit} from './lib/audit-utils.mjs';

const pureDomainFiles = [
    'src/generator/constraints.ts', 'src/generator/coreWarmup.ts', 'src/generator/deterministicGenerator.ts',
    'src/generator/progression.ts', 'src/generator/types.ts', 'src/programs/duration.ts',
    'src/progress/calculations.ts', 'src/progression/types.ts', 'src/workout/types.ts',
];
const forbiddenDomainImports = ['react', '@mui/', 'dexie', 'dexie-react-hooks'];
const domainViolations = [];
for (const relative of pureDomainFiles) {
    const source = await readFile(path.join(root, relative), 'utf8');
    for (const forbidden of forbiddenDomainImports) {
        if (source.includes(`from '${forbidden}`) || source.includes(`from "${forbidden}`)) domainViolations.push(`${relative}: ${forbidden}`);
    }
}

const sourceFiles = await walk('src', ['.ts', '.tsx']);
const secondUiSystems = [];
const directUiDatabase = [];
for (const file of sourceFiles) {
    const source = await readFile(file, 'utf8');
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (/from ['"](?:@radix-ui|@chakra-ui|antd|tailwind|daisyui|shadcn)/.test(source)) secondUiSystems.push(relative);
    if (relative.startsWith('src/pages/') && /\bdb\.[a-zA-Z]+\.(?:get|put|add|delete|clear|bulkPut|where|toArray|count)\b/.test(source)) directUiDatabase.push(relative);
}

const checks = [
    {check: 'pure domain boundaries', status: domainViolations.length ? 'fail' : 'pass', detail: domainViolations.join(', ') || `${pureDomainFiles.length} files`},
    {check: 'single UI system', status: secondUiSystems.length ? 'fail' : 'pass', detail: secondUiSystems.join(', ') || 'Material UI only'},
    {check: 'release route splitting', status: (await readFile(path.join(root, 'src/AppRoutes.tsx'), 'utf8')).includes('React.lazy') ? 'pass' : 'fail', detail: 'route-level lazy imports'},
    {check: 'legacy direct UI database access', status: directUiDatabase.length ? 'warning' : 'pass', detail: `${directUiDatabase.length} legacy page file(s)`},
];
await writeAudit('architecture-audit', {generatedAt: new Date().toISOString(), checks, domainViolations, secondUiSystems, directUiDatabase}, `# Architecture audit\n\n${markdownTable(checks)}\n`);
if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
