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
const report = {generatedAt: new Date().toISOString(), allowedRuntimeOrigins: ['self'], discoveredLiteralOrigins: [...origins].sort(), forbiddenRuntimeReferences: forbidden};
const markdown = `# Network and privacy audit\n\nRuntime allowlist: same origin only.\n\nForbidden runtime references: **${forbidden.length}**.\n`;
await writeAudit('network-origins', report, markdown);
await writeFile(path.join(root, 'artifacts', 'audit', 'network-audit.md'), markdown);
await unlink(path.join(root, 'artifacts', 'audit', 'network-origins.md'));
if (forbidden.length) process.exitCode = 1;
