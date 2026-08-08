import {describe, expect, it} from 'vitest';
import {calculateExerciseProgress, calculateProgressOverview, estimatedOneRepMax} from './calculations';
import {PerformedSetRecord, SessionExerciseRecord, WorkoutSessionRecord} from '../workout/types';

const session = (id: string, startedAt: string, elapsedSeconds = 1800): WorkoutSessionRecord => ({id, creationOperationId: `op-${id}`, nameSnapshot: id, status: 'completed', startedAt, endedAt: startedAt, pausedDurationSeconds: 0, elapsedSeconds, currentSessionExerciseId: `exercise-${id}`, currentSetId: `set-${id}`, createdAt: startedAt, updatedAt: startedAt});
const exercise = (id: string, sessionId: string, exerciseId = 'squat'): SessionExerciseRecord => ({id, sessionId, exerciseId, exerciseNameSnapshot: 'snapshot', prescriptionSnapshot: 'snapshot', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 0, status: 'completed', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:00:00Z'});
const set = (id: string, sessionId: string, sessionExerciseId: string, load: number, reps: number): PerformedSetRecord => ({id, sessionId, sessionExerciseId, sequenceIndex: 0, status: 'completed', targetRepsMin: 5, targetRepsMax: 10, actualReps: reps, targetLoadKg: load, actualLoadKg: load, targetRir: 2, restSeconds: 120, completedAt: '2026-08-01T10:10:00Z', createdAt: '2026-08-01T10:00:00Z', updatedAt: '2026-08-01T10:10:00Z'});

describe('progress calculations', () => {
    it('calculates raw history, records and a clearly estimated max trend', () => {
        const sessions = [session('a', '2026-08-01T10:00:00Z'), session('b', '2026-08-08T10:00:00Z')];
        const exercises = [exercise('ea', 'a'), exercise('eb', 'b')];
        const sets = [set('sa', 'a', 'ea', 100, 5), {...set('sb', 'b', 'eb', 95, 10), completedAt: '2026-08-08T10:10:00Z'}];
        const result = calculateExerciseProgress('squat', sessions, exercises, sets);
        expect(estimatedOneRepMax(100, 5)).toBe(116.7);
        expect(result.records).toEqual({maxLoadKg: 100, maxReps: 10, maxVolumeSetKg: 950, estimatedOneRepMaxKg: 126.7});
        expect(result.estimatedMaxTrend).toHaveLength(2);
        expect(result.volumeTrend).toEqual([{recordedAt: '2026-08-01', volumeKg: 500}, {recordedAt: '2026-08-08', volumeKg: 950}]);
        expect(result.textSummary).toContain('estimated maximum');
    });

    it('aggregates weekly/monthly frequency, volume, duration and taxonomy distributions', () => {
        const sessions = [session('a', '2026-08-01T10:00:00Z'), session('b', '2026-08-08T10:00:00Z', 2400)];
        const exercises = [exercise('ea', 'a'), exercise('eb', 'b')];
        const result = calculateProgressOverview(sessions, exercises, [set('sa', 'a', 'ea', 100, 5), set('sb', 'b', 'eb', 100, 6)], {squat: {movement: 'squat', muscles: ['quadriceps']}});
        expect(result).toMatchObject({completedSessions: 2, totalSets: 2, totalVolumeKg: 1100, totalDurationSeconds: 4200, movementDistribution: {squat: 2}, muscleDistribution: {quadriceps: 2}});
        expect(result.weeklyFrequency).toHaveLength(2);
        expect(result.monthlyFrequency).toEqual([{period: '2026-08', sessions: 2}]);
        expect(result.sessionTrend.map((entry) => entry.volumeKg)).toEqual([500, 600]);
    });
});
