import {mkdir, readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib/audit-utils.mjs';

const build = path.join(root, 'build');
const entries = [];
async function visit(directory) {
    for (const item of await readdir(directory, {withFileTypes: true})) {
        const absolute = path.join(directory, item.name);
        if (item.isDirectory()) await visit(absolute);
        else entries.push({path: path.relative(build, absolute).replaceAll('\\', '/'), bytes: (await stat(absolute)).size});
    }
}
await visit(build);
entries.sort((a, b) => b.bytes - a.bytes);
await mkdir(path.join(root, 'artifacts'), {recursive: true});
await writeFile(path.join(root, 'artifacts', 'bundle-report.json'), `${JSON.stringify({generatedAt: new Date().toISOString(), totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0), files: entries}, null, 2)}\n`);
process.stdout.write(`Bundle report: ${entries.length} files, ${entries.reduce((sum, entry) => sum + entry.bytes, 0)} bytes\n`);
