import {describe, expect, it} from 'vitest';
import {parseNonNegativeDecimal, shouldInitializeNumericDraft} from './numericInput';

describe('workout numeric input', () => {
    it('allows an empty intermediate value while replacing zero', () => {
        expect(parseNonNegativeDecimal('')).toBeUndefined();
        expect(parseNonNegativeDecimal('12')).toBe(12);
        expect(parseNonNegativeDecimal('12.5')).toBe(12.5);
    });

    it('rejects invalid and negative loads', () => {
        expect(parseNonNegativeDecimal('-1')).toBeUndefined();
        expect(parseNonNegativeDecimal('not-a-number')).toBeUndefined();
    });

    it('preserves an edited repetition draft while the same set is refreshed', () => {
        expect(shouldInitializeNumericDraft(undefined, 'set-1')).toBe(true);
        expect(shouldInitializeNumericDraft('set-1', 'set-1')).toBe(false);
        expect(shouldInitializeNumericDraft('set-1', 'set-2')).toBe(true);
    });
});
