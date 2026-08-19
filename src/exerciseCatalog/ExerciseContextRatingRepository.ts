import {DexieDB} from '../db/db';
import type {GoalBlend} from '../generator/types';
import type {QuickSessionZone} from '../generator/quickSession';

export const EXERCISE_CONTEXT_RATINGS_META_KEY = 'exerciseContextRatings:v1';

export interface ExerciseRatingContext {
    zone: QuickSessionZone;
    goal: GoalBlend;
}

export interface ExerciseContextRating extends ExerciseRatingContext {
    exerciseId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    updatedAt: string;
}

export function exerciseRatingContextKey(context: ExerciseRatingContext): string {
    return `${context.zone}:${context.goal}`;
}

function recordKey(exerciseId: string, context: ExerciseRatingContext): string {
    return `${exerciseRatingContextKey(context)}:${exerciseId}`;
}

function parseRatings(value: string | undefined): Record<string, ExerciseContextRating> {
    if (!value) return {};
    try {
        const parsed = JSON.parse(value) as Record<string, ExerciseContextRating>;
        return Object.fromEntries(Object.entries(parsed).filter(([, entry]) =>
            Boolean(entry?.exerciseId)
            && Number.isInteger(entry.rating)
            && entry.rating >= 1
            && entry.rating <= 5
            && Boolean(entry.zone)
            && Boolean(entry.goal)
        ));
    } catch {
        return {};
    }
}

export class ExerciseContextRatingRepository {
    constructor(private readonly db: DexieDB) {}

    async list(context: ExerciseRatingContext): Promise<ExerciseContextRating[]> {
        const ratings = parseRatings((await this.db.appMeta.get(EXERCISE_CONTEXT_RATINGS_META_KEY))?.value);
        const contextKey = exerciseRatingContextKey(context);
        return Object.values(ratings)
            .filter((entry) => exerciseRatingContextKey(entry) === contextKey)
            .sort((left, right) => left.exerciseId.localeCompare(right.exerciseId));
    }

    async get(exerciseId: string, context: ExerciseRatingContext): Promise<ExerciseContextRating | undefined> {
        const ratings = parseRatings((await this.db.appMeta.get(EXERCISE_CONTEXT_RATINGS_META_KEY))?.value);
        return ratings[recordKey(exerciseId, context)];
    }

    async set(exerciseId: string, context: ExerciseRatingContext, rating: 1 | 2 | 3 | 4 | 5): Promise<ExerciseContextRating> {
        if (!exerciseId.trim() || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Exercise ratings must be whole numbers from 1 to 5.');
        const now = new Date().toISOString();
        const result = {exerciseId, ...context, rating, updatedAt: now};
        await this.db.transaction('rw', this.db.appMeta, async () => {
            const ratings = parseRatings((await this.db.appMeta.get(EXERCISE_CONTEXT_RATINGS_META_KEY))?.value);
            ratings[recordKey(exerciseId, context)] = result;
            await this.db.appMeta.put({key: EXERCISE_CONTEXT_RATINGS_META_KEY, value: JSON.stringify(ratings), updatedAt: now});
        });
        return result;
    }
}
