import {mkdir, readFile, readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..', '..');

export async function readJson(relativePath) {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

export async function walk(relativeDirectory, extensions) {
    const base = path.join(root, relativeDirectory);
    const output = [];
    async function visit(current) {
        for (const entry of await readdir(current, {withFileTypes: true})) {
            if (['node_modules', '.git', 'build', 'artifacts'].includes(entry.name)) continue;
            const absolute = path.join(current, entry.name);
            if (entry.isDirectory()) await visit(absolute);
            else if (!extensions || extensions.includes(path.extname(entry.name))) output.push(absolute);
        }
    }
    await visit(base);
    return output;
}

export async function writeAudit(name, json, markdown) {
    const directory = path.join(root, 'artifacts', 'audit');
    await mkdir(directory, {recursive: true});
    await writeFile(path.join(directory, `${name}.json`), `${JSON.stringify(json, null, 2)}\n`);
    await writeFile(path.join(directory, `${name}.md`), `${markdown.trim()}\n`);
}

export async function fileSize(relativePath) {
    return (await stat(path.join(root, relativePath))).size;
}

export function markdownTable(rows) {
    return ['| Check | Status | Detail |', '| --- | --- | --- |', ...rows.map((row) => `| ${row.check} | ${row.status} | ${String(row.detail).replaceAll('|', '\\|')} |`)].join('\n');
}
