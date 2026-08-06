import {DexieDB} from '../db/db';
import {buildIdentity} from '../config/buildIdentity';
import {diagnosticsDb} from './database';

export type SelfTestLevel = 'pass' | 'warning' | 'fail' | 'unavailable';

export interface SelfTestCheck {
    id: string;
    level: SelfTestLevel;
    message: string;
}

export interface SelfTestResult {
    timestamp: string;
    checks: SelfTestCheck[];
}

const EXPECTED_TABLES = ['exercise', 'workout', 'workoutHistory', 'workoutExercise', 'exerciseSet', 'user', 'userMetric', 'plan'];

export async function runSelfTest(db: DexieDB | undefined): Promise<SelfTestResult> {
    const checks: SelfTestCheck[] = [];
    if (!db) {
        checks.push({id: 'database-open', level: 'fail', message: 'Database context unavailable'});
    } else {
        try {
            await db.open();
            checks.push({id: 'database-open', level: 'pass', message: 'Existing database opened without migration'});
            const tableNames = db.tables.map((table) => table.name);
            const missing = EXPECTED_TABLES.filter((name) => !tableNames.includes(name));
            checks.push({
                id: 'database-schema',
                level: missing.length ? 'fail' : 'pass',
                message: missing.length ? `${missing.length} required tables missing` : `${tableNames.length} expected tables available`,
            });
        } catch (error) {
            checks.push({id: 'database-open', level: 'fail', message: error instanceof Error ? error.name : 'Unknown database error'});
        }
    }

    try {
        const id = `self-test-${Date.now()}`;
        await diagnosticsDb.selfTest.put({id, value: 'ok'});
        const read = await diagnosticsDb.selfTest.get(id);
        await diagnosticsDb.selfTest.delete(id);
        checks.push({id: 'diagnostic-store', level: read?.value === 'ok' ? 'pass' : 'fail', message: 'Temporary diagnostic write/read/delete'});
    } catch (error) {
        checks.push({id: 'diagnostic-store', level: 'fail', message: error instanceof Error ? error.name : 'Unknown diagnostic database error'});
    }

    const identityComplete = Object.values(buildIdentity).every((value) => value !== '' && value !== undefined);
    checks.push({id: 'build-identity', level: identityComplete ? 'pass' : 'fail', message: identityComplete ? 'Build identity complete' : 'Build identity incomplete'});

    if ('storage' in navigator && navigator.storage?.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            checks.push({id: 'storage-estimate', level: 'pass', message: `${estimate.usage ?? 0} bytes used`});
        } catch {
            checks.push({id: 'storage-estimate', level: 'warning', message: 'Storage estimate unavailable'});
        }
    } else {
        checks.push({id: 'storage-estimate', level: 'unavailable', message: 'Storage estimate unsupported'});
    }

    checks.push({
        id: 'service-worker',
        level: 'serviceWorker' in navigator ? 'pass' : 'unavailable',
        message: 'serviceWorker' in navigator ? 'Service worker capability available' : 'Service worker unsupported',
    });

    return {timestamp: new Date().toISOString(), checks};
}
