import {describe, expect, it} from 'vitest';
import {parseNonNegativeDecimal} from './numericInput';

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
});
