import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib/audit-utils.mjs';

const html = await readFile(path.join(root, 'build', 'index.html'), 'utf8');
if (!html.includes('/max-and-gym/assets/') || !html.includes('/max-and-gym/manifest.webmanifest')) {
    throw new Error('GitHub Pages subpath smoke failed');
}
process.stdout.write('GitHub Pages subpath smoke passed\n');
