import {describe, expect, it} from 'vitest';
import {ARM_WORKOUT_45} from './quickWorkouts';

describe('quick workouts', () => {
    it('provides a complete 45-minute arm preview using reviewed local exercises', () => {
        expect(ARM_WORKOUT_45.durationMinutes).toBe(45);
        expect(ARM_WORKOUT_45.exercises).toHaveLength(5);
        expect(ARM_WORKOUT_45.exercises.reduce((total, exercise) => total + exercise.workingSets, 0)).toBe(15);
        expect(ARM_WORKOUT_45.exercises.every((exercise) => exercise.exerciseId.startsWith('fedb:'))).toBe(true);
        expect(ARM_WORKOUT_45.exercises.flatMap((exercise) => exercise.exerciseName.toLowerCase().match(/bicep|curl|triceps/g) ?? [])).not.toHaveLength(0);
    });
});
