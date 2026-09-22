import {access, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {readJson, root, writeAudit} from './lib/audit-utils.mjs';

const lock = await readJson('package-lock.json');
const summary = {};
const unknownInstalled = [];
const absentOptional = [];
const pnpmEntries = await readdir(path.join(root, 'node_modules/.pnpm')).catch(() => []);

function normalizeLicense(value) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) return value.map((entry) => typeof entry === 'string' ? entry : entry?.type).filter(Boolean).join(' OR ');
    return 'UNKNOWN';
}

for (const [packagePath, meta] of Object.entries(lock.packages ?? {})) {
    if (!packagePath || !packagePath.includes('node_modules/')) continue;
    let license = normalizeLicense(meta.license);
    const manifestPath = path.join(root, packagePath, 'package.json');
    try {
        let manifest;
        try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
        catch (error) {
            // npm's lock paths can differ from pnpm's physical installation.
            // Resolve only the exact locked name/version, never a nearby version.
            const name = packagePath.split('node_modules/').at(-1);
            const prefix = `${name.replace('/', '+')}@${meta.version}`;
            const entry = pnpmEntries.find(value => value === prefix || value.startsWith(prefix + '_'));
            if (!entry) throw error;
            manifest = JSON.parse(await readFile(path.join(root, 'node_modules/.pnpm', entry, 'node_modules', name, 'package.json'), 'utf8'));
            if (manifest.name !== name || manifest.version !== meta.version) throw error;
        }
        license = normalizeLicense(manifest.license ?? manifest.licenses ?? license);
    } catch {
        if (meta.optional) {
            absentOptional.push(packagePath.replaceAll('node_modules/', ''));
            continue;
        }
    }
    summary[license] = (summary[license] ?? 0) + 1;
    if (license === 'UNKNOWN') unknownInstalled.push(packagePath.replaceAll('node_modules/', ''));
}

const restricted = Object.keys(summary).filter((license) => /AGPL|SSPL|BUSL/i.test(license));
const provenanceFiles = ['SOURCE_PINS.json', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_CODE_MAP.md', 'COPYING'];
const missingProvenance = [];
for (const file of provenanceFiles) {
    try { await access(path.join(root, file)); } catch { missingProvenance.push(file); }
}
const pins = await readJson('SOURCE_PINS.json');
const incompletePins = Object.entries(pins).filter(([, value]) => typeof value === 'object' && value !== null).filter(([, value]) => !value.repository || !value.commit || !value.license).map(([name]) => name);
const report = {
    generatedAt: new Date().toISOString(),
    rootLicense: 'GPL-3.0-or-later',
    dependencyLicenseSummary: summary,
    unknownInstalled,
    absentOptional,
    restricted,
    provenanceFiles,
    missingProvenance,
    incompletePins,
};
await writeAudit('license-report', report, `# Licence and provenance report\n\n- Root: GPL-3.0-or-later\n- Installed dependency entries: ${Object.values(summary).reduce((a, b) => a + b, 0)}\n- Unknown installed: ${unknownInstalled.length}\n- Restricted: ${restricted.length}\n- Missing provenance files: ${missingProvenance.length}\n- Incomplete immutable pins: ${incompletePins.length}\n- Optional platform packages not installed: ${absentOptional.length}\n`);
if (restricted.length || unknownInstalled.length || missingProvenance.length || incompletePins.length) process.exitCode = 1;
