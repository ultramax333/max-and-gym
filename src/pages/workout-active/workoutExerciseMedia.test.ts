import {describe, expect, it, vi} from 'vitest';
import {LibraryExercise} from '../../exerciseCatalog/types';
import {resolveWorkoutExerciseMedia} from './workoutExerciseMedia';

function exercise(id: string): LibraryExercise {
    return {
        id,
        source: 'free-exercise-db',
        sourceId: id,
        sourceRevision: 'test',
        name: 'Goblet Squat',
        aliases: ['Goblet Squat'],
        category: 'strength',
        force: 'push',
        mechanic: 'compound',
        equipmentTags: ['dumbbell'],
        primaryMuscles: ['quadriceps'],
        secondaryMuscles: [],
        movementPattern: 'squat',
        positionTags: ['standing'],
        transitionTags: [],
        impactTags: [],
        setupTags: [],
        metricType: 'weight-reps',
        defaultRestSeconds: 75,
        defaultRepRange: {min: 8, max: 10},
        defaultRirRange: {min: 1, max: 3},
        contentStatus: 'reviewed',
        generatorEligible: true,
        neverSuggest: false,
        archived: false,
        setupInstructions: '',
        executionSteps: [],
        breathingCue: '',
        commonMistakes: [],
        sourceName: 'test',
        sourceUrl: '',
        license: 'test',
        media: [
            {kind: 'start-image', path: 'media/exercises/goblet-squat-0.jpg', altText: 'Goblet Squat starting position'},
            {kind: 'end-image', path: 'media/exercises/goblet-squat-1.jpg', altText: 'Goblet Squat finishing position'},
            {kind: 'thumbnail', path: 'media/exercises/goblet-squat-0.jpg', altText: 'Goblet Squat thumbnail'},
        ],
        favourite: false,
        effectiveNeverSuggest: false,
    };
}

describe('resolveWorkoutExerciseMedia', () => {
    it('maps a persisted legacy essential-workout ID to reviewed local photos', async () => {
        const reviewed = exercise('fedb:Goblet_Squat');
        const get = vi.fn(async (id: string) => id === reviewed.id ? reviewed : undefined);
        const list = vi.fn(async () => []);

        const media = await resolveWorkoutExerciseMedia({get, list}, 'fixture-goblet-squat', 'Goblet squat');

        expect(get).toHaveBeenNthCalledWith(1, 'fixture-goblet-squat');
        expect(get).toHaveBeenNthCalledWith(2, 'fedb:Goblet_Squat');
        expect(media.map((entry) => entry.kind)).toEqual(['start-image', 'end-image']);
        expect(list).not.toHaveBeenCalled();
    });
});
