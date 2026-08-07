import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {ExerciseMediaAsset, LibraryExercise} from '../../exerciseCatalog/types';

type CatalogLookup = Pick<ExerciseCatalogRepository, 'get' | 'list'>;

const legacyExerciseIds: Record<string, string> = {
    'fixture-goblet-squat': 'fedb:Goblet_Squat',
    'fixture-row': 'fedb:Bent_Over_Two-Dumbbell_Row',
};

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function exerciseMedia(exercise: LibraryExercise | undefined): ExerciseMediaAsset[] {
    return exercise?.media.filter((entry) => entry.kind === 'start-image' || entry.kind === 'end-image') ?? [];
}

export async function resolveWorkoutExerciseMedia(catalog: CatalogLookup, exerciseId: string, exerciseName: string): Promise<ExerciseMediaAsset[]> {
    const direct = await catalog.get(exerciseId);
    if (direct) return exerciseMedia(direct);

    const replacementId = legacyExerciseIds[exerciseId];
    if (replacementId) return exerciseMedia(await catalog.get(replacementId));

    const expectedName = normalize(exerciseName);
    const candidates = await catalog.list({search: exerciseName});
    const match = candidates.find((candidate) => [candidate.name, ...candidate.aliases].some((name) => normalize(name) === expectedName));
    return exerciseMedia(match);
}
