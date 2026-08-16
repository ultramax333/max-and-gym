import {describe, expect, it} from 'vitest';
import {summarizeWorkout} from './summary';
import {ActiveWorkoutSnapshot} from './types';

describe('workout summary', () => {
    it('reports exercise completion, unfinished work, volume and a visible replacement trail', () => {
        const snapshot = {
            session: {id: 'session', creationOperationId: 'start', nameSnapshot: 'Test', status: 'completed', startedAt: '2026-08-16T10:00:00Z', endedAt: '2026-08-16T10:30:00Z', pausedDurationSeconds: 0, elapsedSeconds: 1800, currentSessionExerciseId: 'exercise-a', currentSetId: 'set-a-2', createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:30:00Z'},
            exercises: [
                {id: 'exercise-a', sessionId: 'session', exerciseId: 'replacement', exerciseNameSnapshot: 'Machine Curl', originalExerciseIdSnapshot: 'curl', originalExerciseNameSnapshot: 'Dumbbell Curl', substitutionReason: 'equipment-unavailable', prescriptionSnapshot: '2 × 10', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 0, status: 'completed', createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:30:00Z'},
                {id: 'exercise-b', sessionId: 'session', exerciseId: 'extension', exerciseNameSnapshot: 'Extension', prescriptionSnapshot: '1 × 10', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 1, status: 'pending', createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:30:00Z'},
            ],
            sets: [
                {id: 'set-a-1', sessionId: 'session', sessionExerciseId: 'exercise-a', sequenceIndex: 0, status: 'completed', targetRepsMin: 10, targetRepsMax: 10, actualReps: 10, targetLoadKg: 12, actualLoadKg: 12, targetRir: 2, restSeconds: 60, createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:10:00Z'},
                {id: 'set-a-2', sessionId: 'session', sessionExerciseId: 'exercise-a', sequenceIndex: 1, status: 'completed', targetRepsMin: 10, targetRepsMax: 10, actualReps: 8, targetLoadKg: 14, actualLoadKg: 14, targetRir: 2, restSeconds: 60, createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:15:00Z'},
                {id: 'set-b-1', sessionId: 'session', sessionExerciseId: 'exercise-b', sequenceIndex: 0, status: 'planned', targetRepsMin: 10, targetRepsMax: 10, targetLoadKg: 10, targetRir: 2, restSeconds: 60, createdAt: '2026-08-16T10:00:00Z', updatedAt: '2026-08-16T10:00:00Z'},
            ],
        } satisfies ActiveWorkoutSnapshot;

        expect(summarizeWorkout(snapshot)).toEqual({
            completedExercises: 1,
            incompleteSets: 1,
            totalVolumeKg: 232,
            exercises: [
                {sessionExerciseId: 'exercise-a', name: 'Machine Curl', originalName: 'Dumbbell Curl', completedSets: 2, totalSets: 2, volumeKg: 232, lastCompleted: {loadKg: 14, repetitions: 8}},
                {sessionExerciseId: 'exercise-b', name: 'Extension', completedSets: 0, totalSets: 1, volumeKg: 0},
            ],
        });
    });
});
