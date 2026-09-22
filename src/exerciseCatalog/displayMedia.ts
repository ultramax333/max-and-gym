import {ExerciseMediaAsset, LibraryExercise} from './types';

export type DisplayExerciseMedia = ExerciseMediaAsset & {blob?: Blob};

export function displayExerciseMedia(exercise?: Pick<LibraryExercise, 'name' | 'media' | 'customImage'>): DisplayExerciseMedia[] {
    if (exercise?.customImage) return [{kind: 'start-image', path: '', altText: `${exercise.name} local image`, blob: exercise.customImage}];
    const frames = exercise?.media.filter(entry => entry.kind !== 'thumbnail') ?? [];
    return frames.length ? frames : exercise?.media.slice(0, 1) ?? [];
}
