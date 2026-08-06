import path from 'node:path';
import {startVitest} from 'vitest/node';
import {root} from './lib/audit-utils.mjs';

const filters = process.argv.slice(2);
await startVitest('test', filters, {
    config: false,
    root,
    run: true,
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.join(root, 'src', 'setupTests.ts')],
    passWithNoTests: false,
}, {
    configFile: false,
    define: {
        __APP_VERSION__: JSON.stringify('0.4.0-test'),
        __GIT_SHA__: JSON.stringify('test-sha'),
        __BUILD_TIMESTAMP__: JSON.stringify('2026-08-06T00:00:00.000Z'),
        __BUILD_ENVIRONMENT__: JSON.stringify('test'),
    },
});
