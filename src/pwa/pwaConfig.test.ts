import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

describe('PWA update policy', () => {
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    const provider = readFileSync('src/pwa/PwaContext.tsx', 'utf8');

    it('activates verified updates automatically and lets the persisted workout recover', () => {
        expect(viteConfig).toContain("registerType: 'autoUpdate'");
        expect(viteConfig).toContain('skipWaiting: true');
        expect(viteConfig).toContain('clientsClaim: true');
        expect(provider).not.toContain('hasActiveWorkoutMarker');
    });

    it('uses only a bounded cache for local reviewed exercise media', () => {
        expect(viteConfig).toContain('max-gym-exercise-media-v${cacheVersion}');
        expect(viteConfig).toContain('maxEntries: 48');
        expect(viteConfig).not.toContain('progress-photo');
    });
});
