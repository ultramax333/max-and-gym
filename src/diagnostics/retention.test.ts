import {describe, expect, it} from 'vitest';
import {buildIdentity} from '../config/buildIdentity';
import {createDiagnosticEvent} from './service';
import {MAX_DIAGNOSTIC_AGE_MS, MAX_DIAGNOSTIC_EVENTS, retainDiagnosticEvents} from './retention';
import {DiagnosticEvent} from './types';

function eventAt(timestamp: number, id: string): DiagnosticEvent {
    return {...createDiagnosticEvent({level: 'info', subsystem: 'BOOT', code: 'BOOT_UNHANDLED_ERROR', safeMessage: 'safe'}), id, timestamp: new Date(timestamp).toISOString()};
}

describe('diagnostic retention and identity', () => {
    it('caps events at 1000 and removes entries older than 30 days', () => {
        const now = Date.now();
        const events = Array.from({length: MAX_DIAGNOSTIC_EVENTS + 20}, (_, index) => eventAt(now - index, String(index)));
        events.push(eventAt(now - MAX_DIAGNOSTIC_AGE_MS - 1, 'old'));
        const retained = retainDiagnosticEvents(events, now);
        expect(retained).toHaveLength(MAX_DIAGNOSTIC_EVENTS);
        expect(retained.some((event) => event.id === 'old')).toBe(false);
    });

    it('attaches stable error code and build ID', () => {
        const event = createDiagnosticEvent({level: 'error', subsystem: 'UI', code: 'UI_ROUTE_RENDER_FAILED', safeMessage: 'Protected route failed'});
        expect(event.code).toBe('UI_ROUTE_RENDER_FAILED');
        expect(event.buildId).toBe(buildIdentity.buildId);
        expect(event.databaseSchemaVersion).toBe(8);
    });
});
