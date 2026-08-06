import {stat} from 'node:fs/promises';
import path from 'node:path';
import {root, walk, writeAudit} from './lib/audit-utils.mjs';

const files = await walk('public');
const assets = [];
for (const file of files) assets.push({path: path.relative(root, file).replaceAll('\\', '/'), bytes: (await stat(file)).size});
const oversized = assets.filter((asset) => asset.bytes > 3_000_000);
const report = {generatedAt: new Date().toISOString(), assetCount: assets.length, oversized};
await writeAudit('asset-report', report, `# Asset audit\n\nAssets: ${assets.length}. Oversized: ${oversized.length}.\n`);
if (oversized.length) process.exitCode = 1;
