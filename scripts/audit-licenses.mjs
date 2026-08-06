import {readJson, writeAudit} from './lib/audit-utils.mjs';

const lock = await readJson('package-lock.json');
const summary = {};
const unknown = [];
for (const [name, meta] of Object.entries(lock.packages ?? {})) {
    if (!name || !name.startsWith('node_modules/')) continue;
    const licence = meta.license ?? 'UNKNOWN';
    summary[licence] = (summary[licence] ?? 0) + 1;
    if (licence === 'UNKNOWN') unknown.push(name.replace('node_modules/', ''));
}
const restricted = Object.keys(summary).filter((licence) => /AGPL|SSPL|BUSL/i.test(licence));
const report = {generatedAt: new Date().toISOString(), rootLicense: 'GPL-3.0-or-later', dependencyLicenseSummary: summary, unknown, restricted, provenanceFiles: ['SOURCE_PINS.json', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_CODE_MAP.md']};
await writeAudit('license-report', report, `# Licence report\n\n- Root: GPL-3.0-or-later\n- Dependency entries: ${Object.values(summary).reduce((a, b) => a + b, 0)}\n- Unknown: ${unknown.length}\n- Restricted: ${restricted.length}\n`);
if (restricted.length) process.exitCode = 1;
