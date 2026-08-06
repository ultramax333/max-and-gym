import seed from './reviewed-exercises.json';
import {DexieDB} from '../db/db';
import {CustomExerciseRecord, ExercisePreference, LibraryExercise, LibraryFilters, ReviewedExercise} from './types';

const MAX_CUSTOM_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function merge(exercise: ReviewedExercise, preference?: ExercisePreference): LibraryExercise {
    return {...exercise, favourite: preference?.favourite ?? false, effectiveNeverSuggest: exercise.neverSuggest || (preference?.neverSuggest ?? false)};
}

export class ExerciseCatalogRepository {
    constructor(private readonly db: DexieDB) {}

    async ensureSeed(): Promise<void> {
        const ids = (seed as ReviewedExercise[]).map((entry) => entry.id);
        const existing = await this.db.exerciseCatalog.bulkGet(ids);
        const missing = (seed as ReviewedExercise[]).filter((entry, index) => !existing[index]);
        if (missing.length) await this.db.exerciseCatalog.bulkAdd(missing);
    }

    async list(filters: LibraryFilters = {}): Promise<LibraryExercise[]> {
        await this.ensureSeed();
        const [reviewed, custom, preferences] = await Promise.all([
            this.db.exerciseCatalog.toArray(),
            this.db.customExercise.toArray(),
            this.db.exercisePreference.toArray(),
        ]);
        const preferenceMap = new Map(preferences.map((entry) => [entry.exerciseId, entry]));
        const search = normalize(filters.search ?? '');
        return [...reviewed, ...custom].map((entry) => merge(entry, preferenceMap.get(entry.id))).filter((entry) => {
            const searchable = normalize([entry.name, ...entry.aliases, ...entry.primaryMuscles, ...entry.equipmentTags].join(' '));
            if (search && !searchable.includes(search)) return false;
            if (filters.equipment && !entry.equipmentTags.includes(filters.equipment)) return false;
            if (filters.muscle && !entry.primaryMuscles.includes(filters.muscle) && !entry.secondaryMuscles.includes(filters.muscle)) return false;
            if (filters.movementPattern && entry.movementPattern !== filters.movementPattern) return false;
            if (filters.position && !entry.positionTags.includes(filters.position)) return false;
            if (filters.status === 'eligible' && (!entry.generatorEligible || entry.effectiveNeverSuggest)) return false;
            if (filters.status === 'never-suggest' && !entry.effectiveNeverSuggest) return false;
            return !entry.archived;
        }).sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name));
    }

    async get(id: string): Promise<LibraryExercise | undefined> {
        await this.ensureSeed();
        const exercise = await this.db.exerciseCatalog.get(id) ?? await this.db.customExercise.get(id);
        if (!exercise) return undefined;
        return merge(exercise, await this.db.exercisePreference.get(id));
    }

    async alternatives(exercise: LibraryExercise): Promise<LibraryExercise[]> {
        const all = await this.list();
        return all.filter((entry) => entry.id !== exercise.id && entry.generatorEligible && !entry.effectiveNeverSuggest && (entry.movementPattern === exercise.movementPattern || entry.primaryMuscles.some((muscle) => exercise.primaryMuscles.includes(muscle)))).slice(0, 5);
    }

    async updatePreference(id: string, change: Partial<Pick<ExercisePreference, 'favourite' | 'neverSuggest'>>): Promise<void> {
        const previous = await this.db.exercisePreference.get(id);
        await this.db.exercisePreference.put({exerciseId: id, favourite: change.favourite ?? previous?.favourite ?? false, neverSuggest: change.neverSuggest ?? previous?.neverSuggest ?? false, updatedAt: new Date().toISOString()});
    }

    async createCustom(input: {name: string; equipment: string; primaryMuscle: string; image?: Blob}): Promise<CustomExerciseRecord> {
        if (!input.name.trim()) throw new Error('Exercise name is required.');
        if (input.image && (!allowedImageTypes.has(input.image.type) || input.image.size > MAX_CUSTOM_IMAGE_BYTES)) throw new Error('Custom image must be JPEG, PNG or WebP and under 5 MB.');
        const now = new Date().toISOString();
        const id = globalThis.crypto?.randomUUID?.() ?? `custom-${Date.now()}`;
        const record: CustomExerciseRecord = {
            id: `custom:${id}`, source: 'maxgym', sourceId: id, sourceRevision: 'local-v1',
            name: input.name.trim(), aliases: [], category: 'strength', force: 'mixed', mechanic: 'compound',
            equipmentTags: [input.equipment], primaryMuscles: [input.primaryMuscle], secondaryMuscles: [],
            movementPattern: 'accessory', positionTags: ['standing-or-supported'], transitionTags: [], impactTags: [], setupTags: [input.equipment],
            metricType: 'weight-reps', defaultRestSeconds: 75, defaultRepRange: {min: 8, max: 12}, defaultRirRange: {min: 1, max: 3},
            contentStatus: 'custom', generatorEligible: true, neverSuggest: false, archived: false,
            setupInstructions: 'Set up in a stable and comfortable position.', executionSteps: ['Move with control.', 'Stop if the movement feels unsuitable.'],
            breathingCue: 'Breathe steadily through the repetition.', commonMistakes: ['Rushing repetitions', 'Using an unstable setup'],
            sourceName: 'max&gym local exercise', sourceUrl: '', license: 'User-created', media: [],
            customImage: input.image, customImageMimeType: input.image?.type, createdAt: now, updatedAt: now,
        };
        await this.db.customExercise.add(record);
        return record;
    }
}

export {MAX_CUSTOM_IMAGE_BYTES};
