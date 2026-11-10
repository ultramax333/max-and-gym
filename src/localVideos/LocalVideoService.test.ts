import 'fake-indexeddb/auto';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import Dexie from 'dexie';
import {DexieDB} from '../db/db';
import {LocalVideoRepository} from './LocalVideoRepository';
import {LocalVideoService} from './LocalVideoService';
import {VideoFileStore} from './videoFiles';
import {LOCAL_VIDEOS_META_KEY, parseLocalVideos} from './model';

vi.mock('../diagnostics/service', () => ({recordDiagnostic: vi.fn()}));
class MemoryVideos implements VideoFileStore {
    blobs = new Map<string, Blob>();
    failWrite = false;
    failRemove = false;
    supported() { return true; }
    async write(id: string, file: Blob) {
        if (this.failWrite) throw new DOMException('Full', 'QuotaExceededError');
        this.blobs.set(id, file);
    }
    async read(id: string) {
        const file = this.blobs.get(id);
        if (!file) throw new DOMException('Missing', 'NotFoundError');
        return file;
    }
    async has(id: string) { return this.blobs.has(id); }
    async remove(id: string) { if (this.failRemove) throw new Error('Unavailable'); this.blobs.delete(id); }
}
describe('personal local video lifecycle', () => {
    let db: DexieDB;
    let repository: LocalVideoRepository;
    let files: MemoryVideos;
    let service: LocalVideoService;
    const clip = () => new File(['synthetic-video'], 'Synthetic core.mp4', {type: 'video/mp4'});
    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new LocalVideoRepository(db);
        files = new MemoryVideos();
        service = new LocalVideoService(repository, files, async () => 900);
    });
    afterEach(async () => {vi.restoreAllMocks(); db.close(); await Dexie.delete('weightlog'); localStorage.clear();});
    it('imports an unclassified copy and preserves area/difficulty edits after reopening the database', async () => {
        const video = await service.import(clip());
        expect(video).toMatchObject({title: 'Synthetic core', areas: [], durationSeconds: 900});
        expect(video.difficulty).toBeUndefined();
        await repository.update(video.id, {areas: ['abs', 'back'], difficulty: 4});
        db.close();
        db = new DexieDB();
        const reopened = new LocalVideoService(new LocalVideoRepository(db), files);
        expect(await reopened.list()).toEqual([expect.objectContaining({id: video.id, areas: ['abs', 'back'], difficulty: 4, available: true})]);
        expect(files.blobs.size).toBe(1);
    });
    it('publishes no metadata on copy failure and leaves existing videos untouched', async () => {
        const first = await service.import(clip());
        files.failWrite = true;
        await expect(service.import(clip())).rejects.toMatchObject({name: 'QuotaExceededError'});
        expect(await repository.list()).toEqual([first]);
        expect(files.blobs.size).toBe(1);
    });
    it('cleans up a new copy if its metadata commit fails', async () => {
        vi.spyOn(repository, 'add').mockRejectedValueOnce(new Error('Synthetic commit failure'));
        await expect(service.import(clip())).rejects.toThrow('Synthetic commit failure');
        expect(await repository.list()).toEqual([]);
        expect(files.blobs.size).toBe(0);
    });
    it('refuses unsupported files and cancelled imports before storing a copy', async () => {
        await expect(service.import(new File(['x'], 'not-video.svg', {type: 'image/svg+xml'}))).rejects.toThrow('Choose a video');
        const controller = new AbortController(); controller.abort();
        await expect(service.import(clip(), undefined, controller.signal)).rejects.toMatchObject({name: 'AbortError'});
        expect(files.blobs.size).toBe(0);
        expect(await repository.list()).toEqual([]);
    });
    it('reports a restored reference as missing and reattaches a copy without losing classification', async () => {
        const video = await service.import(clip());
        await repository.update(video.id, {areas: ['abs'], difficulty: 5});
        const anotherDevice = new MemoryVideos();
        const restored = new LocalVideoService(repository, anotherDevice, async () => 900);
        expect((await restored.list())[0].available).toBe(false);
        const reattached = await restored.import(clip(), undefined, undefined, video.id);
        expect(reattached).toMatchObject({id: video.id, areas: ['abs'], difficulty: 5});
        expect(reattached.assetId).not.toBe(video.assetId);
        expect((await restored.list())[0].available).toBe(true);
        expect(files.blobs.has(video.assetId)).toBe(true); // Original device is not touched.
    });
    it('keeps the previous copy and details when a reattach commit fails', async () => {
        const video = await service.import(clip());
        vi.spyOn(repository, 'update').mockRejectedValueOnce(new Error('Synthetic failure'));
        await expect(service.import(clip(), undefined, undefined, video.id)).rejects.toThrow();
        expect(await repository.list()).toEqual([video]);
        expect([...files.blobs.keys()]).toEqual([video.assetId]);
    });
    it('restores the reference when physical deletion fails, then allows a retry', async () => {
        const video = await service.import(clip());
        files.failRemove = true;
        await expect(service.remove(video.id)).rejects.toThrow();
        expect(await repository.list()).toEqual([video]);
        files.failRemove = false;
        await service.remove(video.id);
        expect(await repository.list()).toEqual([]);
        expect(files.blobs.size).toBe(0);
    });
    it('rejects path-like asset IDs, bad ratings and corrupt metadata rather than overwriting them', async () => {
        const video = await service.import(clip());
        await expect(repository.update(video.id, {difficulty: 6})).rejects.toThrow();
        expect(() => parseLocalVideos(JSON.stringify([{...video, assetId: '../other-file'}]))).toThrow();
        await db.appMeta.put({key: LOCAL_VIDEOS_META_KEY, value: '{broken', updatedAt: new Date().toISOString()});
        await expect(service.import(clip())).rejects.toThrow();
        expect((await db.appMeta.get(LOCAL_VIDEOS_META_KEY))?.value).toBe('{broken');
        expect(files.blobs.size).toBe(1);
    });
    it('rejects a shared media identity so deleting one entry cannot remove another video copy', async () => {
        const first = await service.import(clip());
        const second = await service.import(clip());
        await expect(repository.update(second.id, {assetId: first.assetId})).rejects.toThrow('conflicting references');
        expect(await repository.list()).toEqual([first, second]);
        expect(files.blobs.size).toBe(2);
    });
});
