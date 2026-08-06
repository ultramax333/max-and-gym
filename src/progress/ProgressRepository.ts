import {DexieDB} from '../db/db';
import {calculateExerciseProgress, calculateProgressOverview, ExerciseProgress, ProgressOverview} from './calculations';
import {SessionExerciseRecord, WorkoutSessionRecord} from '../workout/types';

export interface WorkoutHistoryEntry extends WorkoutSessionRecord {exerciseCount: number; setCount: number}

export class ProgressRepository {
    constructor(private readonly db: DexieDB) {}

    async overview(): Promise<ProgressOverview> {
        const [sessions, exercises, sets, catalog] = await Promise.all([this.db.workoutSession.toArray(), this.db.sessionExercise.toArray(), this.db.performedSet.toArray(), this.db.exerciseCatalog.toArray()]);
        const taxonomy = Object.fromEntries(catalog.map((entry) => [entry.id, {movement: entry.movementPattern, muscles: entry.primaryMuscles}]));
        return calculateProgressOverview(sessions, exercises, sets, taxonomy);
    }

    async workoutHistory(): Promise<WorkoutHistoryEntry[]> {
        const sessions = await this.db.workoutSession.where('status').equals('completed').toArray();
        return Promise.all(sessions.sort((a, b) => (b.endedAt ?? b.startedAt).localeCompare(a.endedAt ?? a.startedAt)).map(async (session) => ({...session, exerciseCount: await this.db.sessionExercise.where('sessionId').equals(session.id).count(), setCount: await this.db.performedSet.where('sessionId').equals(session.id).and((entry) => entry.status === 'completed').count()})));
    }

    async exerciseOptions(): Promise<Array<Pick<SessionExerciseRecord, 'exerciseId' | 'exerciseNameSnapshot'>>> {
        const rows = await this.db.sessionExercise.toArray();
        const unique = new Map<string, Pick<SessionExerciseRecord, 'exerciseId' | 'exerciseNameSnapshot'>>();
        for (const row of rows) if (!unique.has(row.exerciseId)) unique.set(row.exerciseId, {exerciseId: row.exerciseId, exerciseNameSnapshot: row.exerciseNameSnapshot});
        return [...unique.values()].sort((a, b) => a.exerciseNameSnapshot.localeCompare(b.exerciseNameSnapshot));
    }

    async exercise(exerciseId: string): Promise<ExerciseProgress> {
        const [sessions, exercises, sets] = await Promise.all([this.db.workoutSession.toArray(), this.db.sessionExercise.toArray(), this.db.performedSet.toArray()]);
        return calculateExerciseProgress(exerciseId, sessions, exercises, sets);
    }
}
