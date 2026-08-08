import {describe, expect, it} from 'vitest';
import {orderSetsForExecution} from './DexieWorkoutRepository';
import {PerformedSetRecord, SessionExerciseRecord} from './types';

const iso = '2026-08-08T08:00:00.000Z';
const exercise = (id: string, sequenceIndex: number, groupIdSnapshot?: string, groupSequenceIndexSnapshot = 0): SessionExerciseRecord => ({
    id, sessionId: 'session', exerciseId: id, exerciseNameSnapshot: id, prescriptionSnapshot: '3 sets', lockedSnapshot: false,
    alternativeExerciseIdsSnapshot: [], sequenceIndex, status: sequenceIndex === 0 ? 'active' : 'pending', groupIdSnapshot,
    groupTypeSnapshot: groupIdSnapshot ? 'superset' : 'single', groupSequenceIndexSnapshot, createdAt: iso, updatedAt: iso,
});
const set = (id: string, sessionExerciseId: string, sequenceIndex: number): PerformedSetRecord => ({
    id, sessionId: 'session', sessionExerciseId, sequenceIndex, status: 'planned', setKind: 'working', targetRepsMin: 8,
    targetRepsMax: 12, targetLoadKg: 10, targetRir: 2, restSeconds: 60, createdAt: iso, updatedAt: iso,
});

describe('workout execution order', () => {
    it('keeps straight exercises sequential', () => {
        const exercises = [exercise('a', 0), exercise('b', 1)];
        const result = orderSetsForExecution(exercises, [set('a2', 'a', 1), set('b1', 'b', 0), set('a1', 'a', 0)]);
        expect(result.map((entry) => entry.id)).toEqual(['a1', 'a2', 'b1']);
    });

    it('alternates grouped exercises by round', () => {
        const exercises = [exercise('a', 0, 'group', 0), exercise('b', 1, 'group', 1), exercise('c', 2)];
        const result = orderSetsForExecution(exercises, [set('b2', 'b', 1), set('c1', 'c', 0), set('a2', 'a', 1), set('b1', 'b', 0), set('a1', 'a', 0)]);
        expect(result.map((entry) => entry.id)).toEqual(['a1', 'b1', 'a2', 'b2', 'c1']);
    });
});
