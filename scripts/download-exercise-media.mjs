import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const revision = 'b0eed061e1c8';
const catalog = JSON.parse(await readFile(path.join(root, 'src', 'exerciseCatalog', 'reviewed-exercises.json'), 'utf8'));
const mediaRoot = path.join(root, 'public', 'media', 'exercises');
const reportFile = path.join(root, 'docs', 'reports', 'generated', '04-media-assets.json');

function dimensions(buffer) {
    for (let index = 2; index < buffer.length - 9; index += 1) {
        if (buffer[index] !== 0xff) continue;
        const marker = buffer[index + 1];
        if (marker >= 0xc0 && marker <= 0xc3) return {height: buffer.readUInt16BE(index + 5), width: buffer.readUInt16BE(index + 7)};
    }
    return {width: 0, height: 0};
}

async function download(entry) {
    const images = entry.media.filter((media) => media.kind === 'start-image' || media.kind === 'end-image');
    const results = [];
    for (const [index, media] of images.entries()) {
        const destination = path.join(root, 'public', media.path);
        await mkdir(path.dirname(destination), {recursive: true});
        try {
            await stat(destination);
        } catch {
            const url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${revision}/exercises/${entry.sourceId}/${index}.jpg`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Media download failed: ${response.status} ${entry.sourceId}`);
            const buffer = Buffer.from(await response.arrayBuffer());
            if (buffer.byteLength > 1_500_000) throw new Error(`Media too large: ${entry.sourceId}`);
            await writeFile(destination, buffer);
        }
        const buffer = await readFile(destination);
        results.push({path: media.path, byteSize: buffer.byteLength, ...dimensions(buffer)});
    }
    return results;
}

const output = [];
for (const entry of catalog) output.push({id: entry.id, assets: await download(entry)});
const assets = output.flatMap((entry) => entry.assets);
if (assets.some((asset) => asset.width === 0 || asset.height === 0 || asset.byteSize > 1_500_000)) throw new Error('Invalid local exercise media.');
await writeFile(reportFile, JSON.stringify({revision, assetCount: assets.length, totalBytes: assets.reduce((sum, asset) => sum + asset.byteSize, 0), assets}, null, 2) + '\n');
process.stdout.write(`Downloaded and audited ${assets.length} local exercise images.\n`);
