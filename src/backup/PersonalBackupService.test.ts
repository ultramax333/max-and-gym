import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {Blob as NodeBlob} from 'node:buffer';
import {DexieDB} from '../db/db';
import {CustomExerciseRecord} from '../exerciseCatalog/types';
import {buildPersonalBackup, BackupError, importPersonalBackup, previewPersonalBackup} from './PersonalBackupService';

describe('personal backup', () => {
    let db: DexieDB;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); db = new DexieDB(); await db.open(); });
    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    async function seed(): Promise<void> {
        await db.bodyMeasurement.add({id: 'measurement-1', recordedAt: '2026-08-06', type: 'weight', value: 80, unit: 'kg', note: 'private', createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.mediaBlob.bulkAdd([
            {id: 'image-1', purpose: 'progress-photo', blob: new NodeBlob(['image'], {type: 'image/webp'}) as unknown as Blob, mimeType: 'image/webp', width: 100, height: 200, byteSize: 5, checksum: 'source-a', createdAt: '2026-08-06T00:00:00Z'},
            {id: 'thumb-1', purpose: 'progress-thumbnail', blob: new NodeBlob(['thumb'], {type: 'image/webp'}) as unknown as Blob, mimeType: 'image/webp', width: 20, height: 40, byteSize: 5, checksum: 'source-b', createdAt: '2026-08-06T00:00:00Z'},
        ]);
        await db.progressPhoto.add({id: 'photo-1', recordedAt: '2026-08-06', pose: 'front', imageBlobId: 'image-1', thumbnailBlobId: 'thumb-1', note: 'private', blurThumbnail: false, originalByteSize: 20, storedByteSize: 10, createdAt: '2026-08-06T00:00:00Z', updatedAt: '2026-08-06T00:00:00Z'});
        await db.customExercise.add({id: 'custom-1', name: 'Private custom', customImage: new NodeBlob(['custom'], {type: 'image/webp'}) as unknown as Blob, customImageMimeType: 'image/webp'} as unknown as CustomExerciseRecord);
    }

    it('survives export, clear and Replace restore with photo blobs', async () => {
        await seed();
        const backup = await buildPersonalBackup(db, {now: new Date('2026-08-06T12:00:00Z'), id: 'backup-1'});
        const preview = await previewPersonalBackup(db, backup);
        expect(preview.manifest).toMatchObject({product: 'max-and-gym', mediaCount: 3});
        expect(preview.manifest.files['media/image-1.bin'].sha256).toHaveLength(64);
        expect(preview.manifest.files['media/custom-exercise/custom-1.bin'].sha256).toHaveLength(64);
        await db.transaction('rw', [db.bodyMeasurement, db.progressPhoto, db.mediaBlob], async () => { await db.bodyMeasurement.clear(); await db.progressPhoto.clear(); await db.mediaBlob.clear(); });
        await importPersonalBackup(db, backup, {mode: 'replace', now: new Date('2026-08-06T13:00:00Z'), id: 'restore-1'});
        expect(await db.bodyMeasurement.count()).toBe(1);
        expect(await db.progressPhoto.count()).toBe(1);
        expect(await db.mediaBlob.get('image-1')).toMatchObject({byteSize: 5, checksum: 'source-a', mimeType: 'image/webp'});
        expect(await db.customExercise.get('custom-1')).toMatchObject({customImageMimeType: 'image/webp'});
        expect(await db.safetySnapshot.count()).toBe(1);
    });

    it('previews merge conflicts and changes nothing when rejected or storage is insufficient', async () => {
        await seed();
        const backup = await buildPersonalBackup(db, {recordSuccess: false});
        expect((await previewPersonalBackup(db, backup)).conflicts).toHaveLength(0);
        await importPersonalBackup(db, backup, {mode: 'merge', conflictPolicy: 'keep-current', id: 'merge-identical'});
        expect(await db.bodyMeasurement.count()).toBe(1);
        expect(await db.progressPhoto.count()).toBe(1);
        await db.bodyMeasurement.update('measurement-1', {value: 81});
        expect((await previewPersonalBackup(db, backup)).conflicts).toContainEqual({table: 'bodyMeasurement', key: 'measurement-1'});
        await expect(importPersonalBackup(db, backup, {mode: 'merge'})).rejects.toBeInstanceOf(BackupError);
        await expect(importPersonalBackup(db, backup, {mode: 'replace', availableBytes: 1})).rejects.toMatchObject({code: 'IMPORT_STORAGE_INSUFFICIENT'});
        expect((await db.bodyMeasurement.get('measurement-1'))?.value).toBe(81);
        expect(await db.safetySnapshot.count()).toBe(1);
    });

    it('rejects future archive versions before any write', async () => {
        await seed();
        const backup = await buildPersonalBackup(db, {recordSuccess: false});
        const bytes = await new Promise<ArrayBuffer>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(backup); });
        const {decodeZip, encodeZip} = await import('./zip');
        const entries = decodeZip(bytes);
        const manifest = entries.find((entry) => entry.path === 'manifest.json')!;
        const value = JSON.parse(new TextDecoder().decode(manifest.bytes));
        value.exportFormatVersion = 999;
        manifest.bytes = new TextEncoder().encode(JSON.stringify(value));
        const future = new Blob([encodeZip(entries)]);
        await expect(importPersonalBackup(db, future, {mode: 'replace'})).rejects.toMatchObject({code: 'IMPORT_UNSUPPORTED_VERSION'});
        expect(await db.bodyMeasurement.count()).toBe(1);
        expect(await db.safetySnapshot.count()).toBe(0);
    });

    it('rejects a corrupt archive before any write', async () => {
        await seed();
        const backup = await buildPersonalBackup(db, {recordSuccess: false});
        const bytes = await new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error);
            reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
            reader.readAsArrayBuffer(backup);
        });
        bytes[Math.floor(bytes.length / 3)] ^= 0xff;
        await expect(importPersonalBackup(db, new Blob([bytes]), {mode: 'replace'})).rejects.toBeInstanceOf(BackupError);
        expect(await db.bodyMeasurement.count()).toBe(1);
        expect(await db.safetySnapshot.count()).toBe(0);
    });
});
