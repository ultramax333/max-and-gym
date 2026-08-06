import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

describe('PWA update policy', () => {
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    const provider = readFileSync('src/pwa/PwaContext.tsx', 'utf8');

    it('waits for explicit user confirmation rather than auto-updating', () => {
        expect(viteConfig).toContain("registerType: 'prompt'");
        expect(viteConfig).not.toContain("registerType: 'autoUpdate'");
        expect(provider).toContain('onNeedRefresh');
        expect(provider).not.toContain('onNeedRefresh() {\n                void updateServiceWorker');
    });

    it('does not define runtime media caches', () => {
        expect(viteConfig).toContain('runtimeCaching: []');
    });
});
