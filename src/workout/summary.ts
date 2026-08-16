import {ActiveWorkoutSnapshot} from './types';

export interface WorkoutExerciseRecap {
    sessionExerciseId: string;
    name: string;
    originalName?: string;
    completedSets: number;
    totalSets: number;
    volumeKg: number;
    lastCompleted?: {loadKg: number; repetitions: number};
}

export interface WorkoutRecap {
    exercises: WorkoutExerciseRecap[];
    completedExercises: number;
    incompleteSets: number;
    totalVolumeKg: number;
}

export function summarizeWorkout(snapshot: ActiveWorkoutSnapshot): WorkoutRecap {
    const exercises = snapshot.exercises.map((exercise) => {
        const sets = snapshot.sets.filter((entry) => entry.sessionExerciseId === exercise.id);
        const completed = sets.filter((entry) => entry.status === 'completed');
        const lastCompletedSet = [...completed].sort((a, b) => b.sequenceIndex - a.sequenceIndex)[0];
        return {
            sessionExerciseId: exercise.id,
            name: exercise.exerciseNameSnapshot,
            ...(exercise.originalExerciseNameSnapshot && exercise.originalExerciseNameSnapshot !== exercise.exerciseNameSnapshot ? {originalName: exercise.originalExerciseNameSnapshot} : {}),
            completedSets: completed.length,
            totalSets: sets.length,
            volumeKg: completed.reduce((sum, entry) => sum + (entry.actualLoadKg ?? 0) * (entry.actualReps ?? 0), 0),
            ...(lastCompletedSet?.actualLoadKg !== undefined && lastCompletedSet.actualReps !== undefined ? {lastCompleted: {loadKg: lastCompletedSet.actualLoadKg, repetitions: lastCompletedSet.actualReps}} : {}),
        };
    });
    return {
        exercises,
        completedExercises: exercises.filter((entry) => entry.totalSets > 0 && entry.completedSets === entry.totalSets).length,
        incompleteSets: snapshot.sets.filter((entry) => entry.status !== 'completed').length,
        totalVolumeKg: exercises.reduce((sum, entry) => sum + entry.volumeKg, 0),
    };
}
