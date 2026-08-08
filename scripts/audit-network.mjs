import {readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root, walk, writeAudit} from './lib/audit-utils.mjs';
import {scanNetworkSource} from './audit-network-lib.mjs';

const files = [...(await walk('src', ['.ts', '.tsx', '.js', '.jsx', '.json'])).filter((file) => !/\.test\.[^.]+$/.test(file)), path.join(root, 'index.html'), path.join(root, 'vite.config.ts')];
const origins = new Set();
const forbidden = [];
for (const file of files) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const result = scanNetworkSource(await readFile(file, 'utf8'), relative);
    result.origins.forEach((origin) => origins.add(origin));
    forbidden.push(...result.forbidden);
}
const allowedRuntimeOrigins = [
    'self',
    'https://api.github.com (manual Android release check only)',
    'https://github.com (user-confirmed Android release download only)',
];
const markdown = `# Network and privacy audit\n\nRuntime allowlist:\n\n- same origin for application assets;\n- \`https://api.github.com/repos/ultramax333/max-and-gym/releases/latest\` only after a manual Android update check;\n- \`https://github.com/ultramax333/max-and-gym/releases/download/…\` only after explicit user confirmation.\n\nThe update check sends no token, cookie, personal data or workout data.\n\nForbidden runtime references: **${forbidden.length}**.\n`;
const report = {generatedAt: new Date().toISOString(), allowedRuntimeOrigins, discoveredLiteralOrigins: [...origins].sort(), forbiddenRuntimeReferences: forbidden};
await writeAudit('network-origins', report, markdown);
await writeFile(path.join(root, 'artifacts', 'audit', 'network-audit.md'), markdown);
await unlink(path.join(root, 'artifacts', 'audit', 'network-origins.md'));
if (forbidden.length) process.exitCode = 1;
