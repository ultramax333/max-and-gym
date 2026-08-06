import {describe, expect, it} from 'vitest';
import {scanNetworkSource} from '../../scripts/audit-network-lib.mjs';

describe('network audit', () => {
    it('detects a forbidden test origin', () => {
        const result = scanNetworkSource('<script src="https://tracker.invalid/collect.js"></script>', 'fixture.html');
        expect(result.forbidden).toHaveLength(1);
        expect(result.origins).toContain('https://tracker.invalid');
    });

    it('allows same-origin application code', () => {
        expect(scanNetworkSource("fetch('/local.json')", 'fixture.ts').forbidden).toHaveLength(0);
    });
});
