import {describe, expect, it} from 'vitest';
import {resolveNativeBackTarget} from './nativeBackNavigation';

describe('native Android back navigation', () => {
    it('returns personal video playback and editing to the video library, then Training', () => {
        expect(resolveNativeBackTarget('/train/local-videos')).toBe('/train');
        expect(resolveNativeBackTarget('/train/local-videos/synthetic')).toBe('/train/local-videos');
        expect(resolveNativeBackTarget('/train/local-videos/synthetic/edit')).toBe('/train/local-videos');
    });
    it('keeps Home open instead of exiting the sole Android activity', () => {
        expect(resolveNativeBackTarget('/')).toBeUndefined();
    });

    it('returns nested app screens to deterministic safe parents', () => {
        expect(resolveNativeBackTarget('/workout/active')).toBe('/train');
        expect(resolveNativeBackTarget('/workout/setup')).toBe('/train');
        expect(resolveNativeBackTarget('/programs/generate')).toBe('/programs');
        expect(resolveNativeBackTarget('/library/fedb%3ACurl')).toBe('/library');
        expect(resolveNativeBackTarget('/settings/rest-alarm')).toBe('/settings');
        expect(resolveNativeBackTarget('/train')).toBe('/');
    });
});
