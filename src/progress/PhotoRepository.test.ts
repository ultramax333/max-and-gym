import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DexieDB} from '../db/db';
import {PhotoRepository} from './PhotoRepository';

describe('PhotoRepository', () => {
    let db: DexieDB;
    let repository: PhotoRepository;
    let id = 0;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); db = new DexieDB(); repository = new PhotoRepository(db, {now: () => new Date('2026-08-06T12:00:00Z'), id: () => `photo-${++id}`}); });
    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); vi.restoreAllMocks(); });

    it('stores image, thumbnail and metadata atomically and removes all three', async () => {
        const processed = {image: {blob: new Blob(['image'], {type: 'image/webp'}), width: 1000, height: 1500, checksum: 'image-check'}, thumbnail: {blob: new Blob(['thumb'], {type: 'image/webp'}), width: 200, height: 300, checksum: 'thumb-check'}, originalByteSize: 100, storedByteSize: 10};
        const photo = await repository.add(processed, {recordedAt: '2026-08-06', pose: 'front', weightKg: 80, note: 'local', blurThumbnail: true});
        expect(await db.mediaBlob.count()).toBe(2);
        expect(await repository.usageBytes()).toBe(10);
        expect((await repository.list())[0]).toMatchObject({id: photo.id, pose: 'front', blurThumbnail: true});
        await repository.delete(photo.id);
        expect(await db.progressPhoto.count()).toBe(0);
        expect(await db.mediaBlob.count()).toBe(0);
    });

    it('releases both temporary object URLs', async () => {
        const processed = {image: {blob: new Blob(['image'], {type: 'image/webp'}), width: 1, height: 1, checksum: 'a'}, thumbnail: {blob: new Blob(['thumb'], {type: 'image/webp'}), width: 1, height: 1, checksum: 'b'}, originalByteSize: 10, storedByteSize: 10};
        const photo = await repository.add(processed, {recordedAt: '2026-08-06', pose: 'side-left', note: '', blurThumbnail: false});
        vi.stubGlobal('URL', {createObjectURL: vi.fn().mockReturnValueOnce('blob:image').mockReturnValueOnce('blob:thumb'), revokeObjectURL: vi.fn()});
        const urls = await repository.objectUrls(photo);
        urls.release();
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    });

    it('maps quota failure to a stable code and leaves no orphan metadata', async () => {
        const processed = {image: {blob: new Blob(['image'], {type: 'image/webp'}), width: 1, height: 1, checksum: 'a'}, thumbnail: {blob: new Blob(['thumb'], {type: 'image/webp'}), width: 1, height: 1, checksum: 'b'}, originalByteSize: 10, storedByteSize: 10};
        vi.spyOn(db, 'transaction').mockRejectedValueOnce(new DOMException('quota', 'QuotaExceededError'));
        await expect(repository.add(processed, {recordedAt: '2026-08-06', pose: 'front', note: '', blurThumbnail: false})).rejects.toMatchObject({code: 'STORAGE_QUOTA_EXCEEDED'});
        expect(await db.progressPhoto.count()).toBe(0);
        expect(await db.mediaBlob.count()).toBe(0);
    });
});
