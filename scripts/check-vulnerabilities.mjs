import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {root, walk} from './lib/audit-utils.mjs';

const input = process.argv[2]
    ? await readFile(path.resolve(root, process.argv[2]), 'utf8')
    : await new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
    });
const audit = JSON.parse(input);
const allowlist = JSON.parse(await readFile(path.join(root, 'security-advisory-allowlist.json'), 'utf8'));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const files = await walk('src', ['.ts', '.tsx', '.js', '.jsx']);
const sources = (await Promise.all(files.map((file) => readFile(file, 'utf8')))).join('\n');
// The advisory concerns React Router's server/RSC action protocol. UI callback
// props named `action` are common in Material UI, so only match concrete
// server/RSC packages and APIs here.
const forbiddenServerSurface = /@react-router\/(?:dev|node|serve)|react-server-dom|createStaticHandler|createRequestHandler|ServerRouter|HydratedRouter/;
const serverSurfaceDetected = forbiddenServerSurface.test(sources);
const findings = [];

for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities ?? {})) {
    if (!['high', 'critical'].includes(vulnerability.severity)) continue;
    for (const item of vulnerability.via ?? []) {
        if (typeof item === 'string') continue;
        const advisoryId = item.url?.split('/').pop();
        const exception = allowlist[advisoryId];
        const directVersion = exception ? pkg.dependencies?.[exception.requiredDirectPackage] : undefined;
        const accepted = Boolean(exception)
            && exception.packages.includes(packageName)
            && directVersion === exception.requiredVersion
            && new Date(exception.expires).getTime() > Date.now()
            && !serverSurfaceDetected;
        findings.push({packageName, advisoryId, severity: item.severity, title: item.title, accepted, rationale: accepted ? exception.rationale : undefined});
    }
}
const blocked = findings.filter((finding) => !finding.accepted);
const output = {generatedAt: new Date().toISOString(), registryMetadata: audit.metadata, findings, blocked, serverSurfaceDetected};
await mkdir(path.join(root, 'artifacts/audit'), {recursive: true});
await writeFile(path.join(root, 'artifacts/audit/security-audit.json'), `${JSON.stringify(output, null, 2)}\n`);
await writeFile(path.join(root, 'artifacts/audit/security-audit.md'), `# Dependency security audit\n\n- Registry findings evaluated: ${findings.length}\n- User-approved unreachable-surface exceptions: ${findings.filter((finding) => finding.accepted).length}\n- Blocking high/critical findings: ${blocked.length}\n- React Router server/RSC surface detected: ${serverSurfaceDetected ? 'yes' : 'no'}\n`);
if (blocked.length) process.exitCode = 1;
