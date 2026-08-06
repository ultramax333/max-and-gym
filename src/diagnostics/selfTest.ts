import {backupDryRun} from '../backup/PersonalBackupService';
import {buildIdentity} from '../config/buildIdentity';
import {DexieDB} from '../db/db';
import {generateProgram} from '../generator/deterministicGenerator';
import {GeneratorCandidate} from '../generator/types';
import {diagnosticsDb} from './database';

export type SelfTestLevel = 'pass' | 'warning' | 'fail' | 'unavailable';
export interface SelfTestCheck {id: string; level: SelfTestLevel; message: string}
export interface SelfTestResult {timestamp: string; checks: SelfTestCheck[]}

const EXPECTED_TABLES = ['exercise', 'workout', 'workoutHistory', 'workoutExercise', 'exerciseSet', 'user', 'userMetric', 'plan', 'workoutSession', 'sessionExercise', 'performedSet', 'restTimer', 'workoutOperation', 'exerciseCatalog', 'exercisePreference', 'customExercise', 'trainingProgram', 'programDay', 'programExercise', 'exercisePrescription', 'progressionRule', 'progressionProposal', 'bodyMeasurement', 'mediaBlob', 'progressPhoto', 'appMeta', 'operationJournal', 'safetySnapshot'];

export async function runSelfTest(db: DexieDB | undefined): Promise<SelfTestResult> {
    const checks: SelfTestCheck[] = [];
    const add = (id: string, level: SelfTestLevel, message: string) => checks.push({id, level, message});
    if (!db) add('database-open', 'fail', 'Database context unavailable');
    else {
        try {
            await db.open();
            add('database-open', 'pass', 'Existing database opened without migration');
            const tableNames = db.tables.map((table) => table.name);
            const missing = EXPECTED_TABLES.filter((name) => !tableNames.includes(name));
            add('database-schema', missing.length ? 'fail' : 'pass', missing.length ? `${missing.length} required tables missing` : `${tableNames.length} expected tables available`);

            const [sessions, sessionExercises, sets, timers, operations, photos, media, programDays, programExercises, prescriptions, rules] = await Promise.all([db.workoutSession.toArray(), db.sessionExercise.toArray(), db.performedSet.toArray(), db.restTimer.toArray(), db.workoutOperation.toArray(), db.progressPhoto.toArray(), db.mediaBlob.toArray(), db.programDay.toArray(), db.programExercise.toArray(), db.exercisePrescription.toArray(), db.progressionRule.toArray()]);
            const sessionExerciseIds = new Set(sessionExercises.map((entry) => entry.id));
            const orphanSets = sets.filter((entry) => !sessionExerciseIds.has(entry.sessionExerciseId)).length;
            add('referential-integrity', orphanSets ? 'fail' : 'pass', orphanSets ? `${orphanSets} orphan set references` : 'Set references are valid');
            const active = sessions.filter((entry) => entry.status === 'active' || entry.status === 'paused');
            add('active-session-count', active.length > 1 ? 'fail' : 'pass', `${active.length} active session record(s)`);
            const creationIds = sessions.map((entry) => entry.creationOperationId);
            const completionIds = sets.flatMap((entry) => entry.completionOperationId ? [entry.completionOperationId] : []);
            const operationDuplicates = creationIds.length - new Set(creationIds).size + completionIds.length - new Set(completionIds).size + operations.length - new Set(operations.map((entry) => entry.operationId)).size;
            add('operation-identifiers', operationDuplicates ? 'fail' : 'pass', operationDuplicates ? `${operationDuplicates} duplicate critical operation identifier(s)` : `${operations.length + creationIds.length + completionIds.length} critical operation identifier(s) unique`);
            const sessionIds = new Set(sessions.map((entry) => entry.id));
            const invalidTimers = timers.filter((entry) => entry.status === 'running' && !sessionIds.has(entry.sessionId)).length;
            add('timer-ownership', invalidTimers ? 'fail' : 'pass', invalidTimers ? `${invalidTimers} invalid timer owner(s)` : 'Active timer ownership valid');
            const mediaIds = new Set(media.map((entry) => entry.id));
            const missingPhotoMedia = photos.reduce((total, entry) => total + Number(!mediaIds.has(entry.imageBlobId)) + Number(!mediaIds.has(entry.thumbnailBlobId)), 0);
            add('photo-references', missingPhotoMedia ? 'fail' : 'pass', missingPhotoMedia ? `${missingPhotoMedia} photo media reference(s) missing` : `${photos.length} photo metadata record(s) valid`);
            const dayIds = new Set(programDays.map((entry) => entry.id));
            const prescriptionIds = new Set(prescriptions.map((entry) => entry.id));
            const ruleIds = new Set(rules.map((entry) => entry.id));
            const invalidProgramRefs = programExercises.filter((entry) => !dayIds.has(entry.programDayId) || !prescriptionIds.has(entry.prescriptionId) || !ruleIds.has(entry.progressionRuleId)).length;
            add('program-references', invalidProgramRefs ? 'fail' : 'pass', invalidProgramRefs ? `${invalidProgramRefs} invalid program reference(s)` : 'Program references valid');

            const dryRun = await backupDryRun(db);
            add('backup-dry-run', dryRun.missingMediaReferences ? 'fail' : 'pass', `${dryRun.tableCount} tables and ${dryRun.mediaCount} media record(s) preflighted without emitting bytes`);

            const catalog = await db.exerciseCatalog.toArray();
            if (catalog.length) {
                const candidates = catalog as GeneratorCandidate[];
                const blocked = candidates.find((entry) => entry.generatorEligible && !entry.neverSuggest)?.id;
                const input = {frequency: 2 as const, durationMinutes: 40 as const, goal: 'balanced' as const, equipment: ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'], priorityMuscles: [], variation: 'moderate' as const, blockedExerciseIds: blocked ? [blocked] : [], blockedTags: [], favouriteExerciseIds: [], neverSuggestExerciseIds: [], stableExercises: [], coreMinutes: 10 as const, lowBackComfortWarmup: true, seed: 'self-test', generatorVersion: buildIdentity.generatorVersion, exerciseSeedVersion: buildIdentity.exerciseSeedVersion, programSeedVersion: buildIdentity.programSeedVersion};
                const first = generateProgram(input, candidates);
                const second = generateProgram({...input, equipment: [...input.equipment].reverse()}, [...candidates].reverse());
                const blockedPresent = first.ok && first.program.days.some((day) => day.exercises.some((entry) => entry.exerciseId === blocked));
                add('generator-hard-exclusion', !first.ok ? 'warning' : blockedPresent ? 'fail' : 'pass', !first.ok ? 'Generator sample unavailable for current catalog' : 'Generator sample respects hard exclusions');
                add('generator-determinism', first.ok && second.ok && JSON.stringify(first.program) === JSON.stringify(second.program) ? 'pass' : 'fail', 'Normalized generator sample is deterministic');
                const provenanceMissing = catalog.filter((entry) => !entry.sourceRevision || !entry.license || !entry.sourceUrl).length;
                add('licence-provenance', provenanceMissing ? 'fail' : 'pass', provenanceMissing ? `${provenanceMissing} provenance record(s) incomplete` : `${catalog.length} catalog provenance record(s) complete`);
            } else {
                add('generator-hard-exclusion', 'warning', 'Generator catalog is not seeded');
                add('generator-determinism', 'warning', 'Generator catalog is not seeded');
                add('licence-provenance', 'warning', 'Catalog provenance unavailable');
            }
        } catch (error) { add('database-open', 'fail', error instanceof Error ? error.name : 'Unknown database error'); }
    }

    try {
        const id = `self-test-${Date.now()}`;
        await diagnosticsDb.selfTest.put({id, value: 'ok'});
        const read = await diagnosticsDb.selfTest.get(id);
        await diagnosticsDb.selfTest.delete(id);
        add('diagnostic-store', read?.value === 'ok' ? 'pass' : 'fail', 'Temporary diagnostic write/read/delete');
    } catch (error) { add('diagnostic-store', 'fail', error instanceof Error ? error.name : 'Unknown diagnostic database error'); }

    const identityComplete = Object.values(buildIdentity).every((value) => value !== '' && value !== undefined);
    add('build-identity', identityComplete ? 'pass' : 'fail', identityComplete ? 'Build identity complete' : 'Build identity incomplete');
    add('seed-version-consistency', buildIdentity.exerciseSeedVersion && buildIdentity.programSeedVersion && buildIdentity.generatorVersion ? 'pass' : 'fail', 'Exercise, program and generator versions declared');

    if (navigator.storage?.estimate) {
        try { const estimate = await navigator.storage.estimate(); add('storage-estimate', 'pass', `${estimate.usage ?? 0} bytes used`); }
        catch { add('storage-estimate', 'warning', 'Storage estimate unavailable'); }
    } else add('storage-estimate', 'unavailable', 'Storage estimate unsupported');

    add('service-worker', 'serviceWorker' in navigator ? 'pass' : 'unavailable', 'serviceWorker' in navigator ? 'Service worker capability available' : 'Service worker unsupported');
    if ('caches' in globalThis) {
        try {
            const names = await caches.keys();
            add('cache-names', names.length ? 'pass' : 'warning', `${names.length} cache(s) available`);
            let userMediaRequests = 0;
            for (const name of names) for (const request of await (await caches.open(name)).keys()) if (/blob:|progress-photo|user-media/i.test(request.url)) userMediaRequests++;
            add('no-user-media-cache', userMediaRequests ? 'fail' : 'pass', `${userMediaRequests} user-media cache request(s)`);
        } catch { add('cache-names', 'warning', 'Cache inspection unavailable'); add('no-user-media-cache', 'warning', 'Cache inspection unavailable'); }
    } else { add('cache-names', 'unavailable', 'Cache API unsupported'); add('no-user-media-cache', 'unavailable', 'Cache API unsupported'); }

    const resourceOrigins = new Set((performance?.getEntriesByType?.('resource') ?? []).flatMap((entry) => { try { const origin = new URL(entry.name, location.href).origin; return origin === location.origin ? [] : [origin]; } catch { return []; } }));
    add('network-origins', resourceOrigins.size ? 'fail' : 'pass', `${resourceOrigins.size} unexpected runtime origin(s)`);
    return {timestamp: new Date().toISOString(), checks};
}
