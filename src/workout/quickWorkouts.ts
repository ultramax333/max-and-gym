import {StartWorkoutInput} from './types';

export interface QuickWorkoutDefinition {
    id: string;
    name: string;
    durationMinutes: number;
    summary: string;
    exercises: StartWorkoutInput['exercises'];
}

export const ARM_WORKOUT_45: QuickWorkoutDefinition = {
    id: 'quick-arms-45',
    name: 'Arms · 45 min',
    durationMinutes: 45,
    summary: 'Five dumbbell exercises for biceps and triceps, with local step photos.',
    exercises: [
        {exerciseId: 'fedb:Dumbbell_Bicep_Curl', exerciseName: 'Dumbbell Bicep Curl', prescriptionSnapshot: '3 × 8–12 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 12, targetLoadKg: 0, targetRir: 2, restSeconds: 75},
        {exerciseId: 'fedb:Dumbbell_One-Arm_Triceps_Extension', exerciseName: 'Dumbbell One-Arm Triceps Extension', prescriptionSnapshot: '3 × 8–12 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 12, targetLoadKg: 0, targetRir: 2, restSeconds: 75},
        {exerciseId: 'fedb:Hammer_Curls', exerciseName: 'Hammer Curls', prescriptionSnapshot: '3 × 8–12 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 12, targetLoadKg: 0, targetRir: 2, restSeconds: 75},
        {exerciseId: 'fedb:Decline_Dumbbell_Triceps_Extension', exerciseName: 'Decline Dumbbell Triceps Extension', prescriptionSnapshot: '3 × 8–12 · rest 75 s', workingSets: 3, repsMin: 8, repsMax: 12, targetLoadKg: 0, targetRir: 2, restSeconds: 75},
        {exerciseId: 'fedb:Concentration_Curls', exerciseName: 'Concentration Curls', prescriptionSnapshot: '3 × 10–12 · rest 75 s', workingSets: 3, repsMin: 10, repsMax: 12, targetLoadKg: 0, targetRir: 2, restSeconds: 75},
    ],
};
