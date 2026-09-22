import {describe, expect, it} from 'vitest';
import {occupancyLevel} from './occupancy';

describe('local gym occupancy profiles', () => {
    it('keeps the three Lausanne clubs distinct on Saturday afternoon', () => {
        const saturday = new Date(2026, 8, 19, 17, 30);
        expect(occupancyLevel('tunnel', saturday)).toBe('busy');
        expect(occupancyLevel('lausanne-gare', saturday)).toBe('moderate');
        expect(occupancyLevel('flon', saturday)).toBe('moderate');
    });

    it('supports a manual override when the room differs from its average', () => {
        const overnight = new Date(2026, 8, 21, 2, 0);
        expect(occupancyLevel('flon', overnight)).toBe('quiet');
        expect(occupancyLevel('flon', overnight, 'force-busy')).toBe('busy');
    });
});
