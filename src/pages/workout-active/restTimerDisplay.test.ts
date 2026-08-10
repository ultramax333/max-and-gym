import {describe, expect, it} from 'vitest';
import {RestTimerRecord} from '../../workout/types';
import {remainingRestSeconds} from './restTimerDisplay';

const timer = (endsAt: string): RestTimerRecord => ({
    id: 'timer', sessionId: 'session', performedSetId: 'set', startedAt: '2026-08-10T10:00:59.000Z',
    endsAt, status: 'running', createdAt: '2026-08-10T10:00:59.000Z', updatedAt: '2026-08-10T10:00:59.000Z',
});

describe('rest timer display', () => {
    it('uses the current render time instead of a stale pre-timer tick', () => {
        const active = timer('2026-08-10T10:01:59.000Z');
        expect(remainingRestSeconds(active, Date.parse('2026-08-10T10:00:59.000Z'))).toBe(60);
        expect(remainingRestSeconds(active, Date.parse('2026-08-10T10:01:00.000Z'))).toBe(59);
    });

    it('uses the frozen paused value', () => {
        expect(remainingRestSeconds({...timer('2026-08-10T10:01:59.000Z'), status: 'paused', remainingWhenPausedSeconds: 42}, Date.parse('2026-08-10T12:00:00.000Z'))).toBe(42);
    });
});
