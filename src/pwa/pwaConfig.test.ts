import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

describe('PWA update policy', () => {
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    const provider = readFileSync('src/pwa/PwaContext.tsx', 'utf8');

    it('defers activation and preserves the current page', () => {
        expect(viteConfig).toContain("registerType: 'prompt'");
        expect(viteConfig).toContain('skipWaiting: false');
        expect(viteConfig).toContain('clientsClaim: true');
        expect(provider).toContain('readAndroidUpdateBlockReason(db)');
        expect(provider).not.toContain('location.reload(');
    });

    it('uses only a bounded cache for local reviewed exercise media', () => {
        expect(viteConfig).toContain('max-gym-exercise-media-v${cacheVersion}');
        expect(viteConfig).toContain('maxEntries: 48');
        expect(viteConfig).not.toContain('progress-photo');
    });
});
