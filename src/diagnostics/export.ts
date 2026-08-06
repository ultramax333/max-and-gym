import {encodeZip} from '../backup/zip';
import {buildIdentity} from '../config/buildIdentity';
import {DexieDB} from '../db/db';
import {redactContext} from './redaction';
import {listDiagnosticEvents} from './service';
import {runSelfTest, SelfTestResult} from './selfTest';

const encoder = new TextEncoder();
const json = (value: unknown) => encoder.encode(JSON.stringify(value, null, 2));

export interface DiagnosticExportResult {blob: Blob; filename: string; categories: string[]}

export async function buildDiagnosticExport(db: DexieDB, suppliedSelfTest?: SelfTestResult): Promise<DiagnosticExportResult> {
    const exportedAt = new Date().toISOString();
    const selfTest = suppliedSelfTest ?? await runSelfTest(db);
    const events = (await listDiagnosticEvents()).map((event) => ({id: event.id, timestamp: event.timestamp, level: event.level, subsystem: event.subsystem, code: event.code, safeMessage: 'Technical diagnostic event.', buildId: event.buildId, databaseSchemaVersion: event.databaseSchemaVersion, route: event.route.replace(/[a-f0-9-]{16,}/gi, ':entity'), operationId: event.operationId ? 'present' : undefined, context: redactContext(event.context)}));
    const counts = Object.fromEntries(await Promise.all(db.tables.map(async (table) => [table.name, await table.count()])));
    const storage: StorageEstimate = navigator.storage?.estimate ? await navigator.storage.estimate().catch(() => ({} as StorageEstimate)) : {};
    const categories = ['build identity', 'environment capabilities', 'database health and counts', 'PWA health', 'storage health', 'self-test results', 'redacted diagnostic events', 'network origins', 'feature status'];
    const files = [
        {path: 'manifest.json', bytes: json({product: 'max-and-gym-diagnostics', exportedAt, versions: buildIdentity, categories, excluded: ['workout data', 'exercise and workout names', 'notes', 'loads', 'repetitions', 'effort and discomfort', 'measurements', 'photos and binary media', 'personal paths']})},
        {path: 'build.json', bytes: json(buildIdentity)},
        {path: 'environment.json', bytes: json({platform: navigator.platform || 'unknown', language: navigator.language?.split('-')[0] ?? 'unknown', online: navigator.onLine})},
        {path: 'database-health.json', bytes: json({open: db.isOpen(), schemaVersion: db.verno, tableCount: db.tables.length, recordCounts: counts})},
        {path: 'pwa-health.json', bytes: json({serviceWorkerSupported: 'serviceWorker' in navigator, controlling: Boolean(navigator.serviceWorker?.controller), cacheVersion: buildIdentity.cacheVersion})},
        {path: 'storage-health.json', bytes: json({estimateAvailable: Boolean(navigator.storage?.estimate), usage: storage.usage, quota: storage.quota})},
        {path: 'capabilities.json', bytes: json({wakeLock: 'wakeLock' in navigator, vibration: 'vibrate' in navigator, notifications: 'Notification' in globalThis, webpCanvas: typeof document !== 'undefined', storageEstimate: Boolean(navigator.storage?.estimate), share: 'share' in navigator, download: typeof document !== 'undefined'})},
        {path: 'self-test.json', bytes: json(selfTest)},
        {path: 'diagnostic-events.json', bytes: json(events)},
        {path: 'network-origins.json', bytes: json({allowed: ['self'], unexpectedCount: selfTest.checks.find((entry) => entry.id === 'network-origins')?.level === 'fail' ? 1 : 0})},
        {path: 'feature-status.json', bytes: json({progress: 'enabled', photos: 'enabled-local-only', backup: 'enabled', generator: buildIdentity.generatorVersion})},
        {path: 'README.txt', bytes: encoder.encode('Max & Gym technical diagnostics. This package intentionally excludes personal training values, names, notes, measurements, photos and media.\n')},
    ];
    const blob = new Blob([encodeZip(files)], {type: 'application/zip'});
    return {blob, filename: `max-and-gym-diagnostics-${exportedAt.replace(/[:.]/g, '-')}.zip`, categories};
}
