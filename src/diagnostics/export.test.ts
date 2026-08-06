import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {decodeZip} from '../backup/zip';
import {DexieDB} from '../db/db';
import {buildDiagnosticExport} from './export';

describe('diagnostic export privacy', () => {
    let db: DexieDB;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); db = new DexieDB(); await db.open(); });
    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    it('contains the complete technical allow-list and no personal fixture values or media', async () => {
        await db.bodyMeasurement.add({id: 'private-measure', recordedAt: '2026-08-06', type: 'weight', value: 83.731, unit: 'kg', note: 'secret-note-983', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.sessionExercise.add({id: 'private-exercise-row', sessionId: 'private-session', exerciseId: 'private-exercise', exerciseNameSnapshot: 'Custom Secret Curl', prescriptionSnapshot: '137.5 kg x 7', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 0, status: 'completed', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.mediaBlob.add({id: 'private-photo', purpose: 'progress-photo', blob: new Blob(['binary-secret-photo']), mimeType: 'image/webp', width: 1, height: 1, byteSize: 19, checksum: 'secret-checksum', createdAt: '2026-08-06T00:00:00Z'});
        const result = await buildDiagnosticExport(db, {timestamp: '2026-08-06T00:00:00Z', checks: [{id: 'fixture', level: 'pass', message: 'Technical fixture'}]});
        const bytes = await new Promise<ArrayBuffer>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(result.blob); });
        const entries = decodeZip(bytes);
        expect(entries.map((entry) => entry.path)).toEqual(expect.arrayContaining(['manifest.json', 'build.json', 'environment.json', 'database-health.json', 'pwa-health.json', 'storage-health.json', 'capabilities.json', 'self-test.json', 'diagnostic-events.json', 'network-origins.json', 'feature-status.json', 'README.txt']));
        const text = entries.map((entry) => new TextDecoder().decode(entry.bytes)).join('\n');
        for (const sensitive of ['83.731', 'secret-note-983', 'Custom Secret Curl', '137.5 kg', 'binary-secret-photo', 'secret-checksum']) expect(text).not.toContain(sensitive);
    });
});
