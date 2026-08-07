import {describe, expect, it} from 'vitest';
import {RELEASE_DEFAULTS} from './releaseDefaults';

describe('version 1 onboarding defaults', () => {
    it('matches the release contract', () => {
        expect(RELEASE_DEFAULTS).toEqual({
            language: 'en',
            featureLevel: 'advanced',
            useLbs: false,
            theme: 'dark',
            frequency: 3,
            durationMinutes: 60,
            coreMinutes: 15,
            goal: 'balanced',
            equipmentProfile: 'full-gym',
            hardExclusionsEnabled: true,
        });
    });
});
