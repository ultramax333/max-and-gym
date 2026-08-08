import {DexieDB} from '../db/db';

export type AndroidUpdateBlockReason = 'active-workout' | 'critical-write';

export async function readAndroidUpdateBlockReason(db: DexieDB): Promise<AndroidUpdateBlockReason | undefined> {
    const [activeWorkouts, backupOrImportWrites, workoutWrites] = await Promise.all([
        db.workoutSession.where('status').anyOf('active', 'paused').count(),
        db.operationJournal.where('status').equals('started').count(),
        db.workoutOperation.where('status').equals('started').count(),
    ]);
    if (activeWorkouts > 0) return 'active-workout';
    if (backupOrImportWrites > 0 || workoutWrites > 0) return 'critical-write';
    return undefined;
}
