import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readJson, root} from './lib/audit-utils.mjs';

const pkg = await readJson('package.json');
const command = (args) => {
    try { return execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim(); }
    catch { return 'unavailable'; }
};
const facts = {
    node: process.version,
    npm: process.env.npm_config_user_agent ?? 'run via npm script',
    operatingSystem: `${os.platform()} ${os.release()} ${os.arch()}`,
    gitBranch: command(['branch', '--show-current']),
    gitSha: command(['rev-parse', '--short=12', 'HEAD']),
    gitStatus: command(['status', '--porcelain']) || 'clean',
    lockfile: existsSync(path.join(root, 'package-lock.json')),
    dependenciesInstalled: existsSync(path.join(root, 'node_modules')),
    viteBase: '/max-and-gym/',
    databaseSchemaVersion: 3,
    serviceWorkerUpdate: 'prompt',
    sourcePins: existsSync(path.join(root, 'SOURCE_PINS.json')),
    package: `${pkg.name}@${pkg.version}`,
};

process.stdout.write(`Max & Gym doctor (read-only)\n${JSON.stringify(facts, null, 2)}\n`);
if (Number(process.versions.node.split('.')[0]) !== 24 || !facts.lockfile || !facts.dependenciesInstalled || !facts.sourcePins) process.exitCode = 1;
