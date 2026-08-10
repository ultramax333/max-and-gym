import {describe, expect, it} from 'vitest';
import {durationTargetDelta, elapsedSeconds, formatElapsedDuration} from './elapsed';
import {WorkoutSessionRecord} from './types';

const session = (change: Partial<WorkoutSessionRecord> = {}): WorkoutSessionRecord => ({
    id: 'session', creationOperationId: 'operation', nameSnapshot: 'Workout', status: 'active',
    startedAt: '2026-08-08T10:00:00.000Z', pausedDurationSeconds: 0,
    currentSessionExerciseId: 'exercise', currentSetId: 'set', createdAt: '2026-08-08T10:00:00.000Z', updatedAt: '2026-08-08T10:00:00.000Z', ...change,
});

describe('planned workout comparison', () => {
    it('reports under, on and over target in whole minutes', () => {
        expect(durationTargetDelta(35 * 60, 40 * 60)).toEqual({label: '5 min under target', tone: 'info'});
        expect(durationTargetDelta(40 * 60, 40 * 60)).toEqual({label: 'On target', tone: 'success'});
        expect(durationTargetDelta(43 * 60, 40 * 60)).toEqual({label: '3 min over target', tone: 'warning'});
        expect(durationTargetDelta(35 * 60)).toBeUndefined();
    });
});

describe('workout elapsed time', () => {
    it('counts active time from the persisted start timestamp', () => {
        expect(elapsedSeconds(session(), Date.parse('2026-08-08T10:12:34.000Z'))).toBe(754);
    });

    it('stops at the persisted pause timestamp and excludes previous pauses', () => {
        expect(elapsedSeconds(session({status: 'paused', pausedAt: '2026-08-08T10:05:00.000Z', pausedDurationSeconds: 60}), Date.parse('2026-08-08T10:12:34.000Z'))).toBe(240);
    });

    it('uses the final persisted duration for completed sessions', () => {
        expect(elapsedSeconds(session({status: 'completed', elapsedSeconds: 3671}), Date.parse('2026-08-08T12:00:00.000Z'))).toBe(3671);
    });

    it('formats minutes and hours without losing seconds', () => {
        expect(formatElapsedDuration(754)).toBe('12:34');
        expect(formatElapsedDuration(3671)).toBe('1:01:11');
    });
});
