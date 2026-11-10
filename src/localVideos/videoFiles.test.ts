import {Blob as NodeBlob} from 'node:buffer';
import {describe, expect, it, vi} from 'vitest';
import {OpfsVideoFileStore} from './videoFiles';

vi.mock('../diagnostics/service', () => ({recordDiagnostic: vi.fn()}));
const id = '00000000-0000-4000-8000-000000000001';
function fixture(quota = 1_000_000_000, failWrite = false) {
    const saved = new Map<string, Blob>();
    const chunkSizes: number[] = [];
    const abort = vi.fn(async () => undefined);
    const directory = {
        async getFileHandle(name: string, options?: {create?: boolean}) {
            if (!saved.has(name) && !options?.create) throw new DOMException('Missing', 'NotFoundError');
            if (!saved.has(name)) saved.set(name, new NodeBlob([]) as unknown as Blob);
            return {
                async getFile() {return saved.get(name)!;},
                async createWritable() {
                    const chunks: ArrayBuffer[] = [];
                    return {
                        async write(chunk: ArrayBuffer) {if (failWrite) throw new DOMException('Full', 'QuotaExceededError'); chunks.push(chunk); chunkSizes.push(chunk.byteLength);},
                        async close() {saved.set(name, new NodeBlob(chunks) as unknown as Blob);},
                        abort,
                    };
                },
            };
        },
        async removeEntry(name: string) {if (!saved.delete(name)) throw new DOMException('Missing', 'NotFoundError');},
    };
    const root = {async getDirectoryHandle() {return directory;}};
    const storage = {async getDirectory() {return root;}, async estimate() {return {quota, usage: 0};}} as unknown as StorageManager;
    return {store: new OpfsVideoFileStore(storage), saved, chunkSizes, abort};
}
describe('bounded private video files', () => {
    it('streams a large file in at most 1 MB pieces and reads/deletes only its own file', async () => {
        const {store, saved, chunkSizes} = fixture();
        const file = new NodeBlob([new Uint8Array(3 * 1024 * 1024 + 17)]) as unknown as Blob;
        await store.write(id, file);
        expect(chunkSizes).toEqual([1024 * 1024, 1024 * 1024, 1024 * 1024, 17]);
        expect((await store.read(id)).size).toBe(file.size);
        expect(await store.has(id)).toBe(true);
        await store.remove(id);
        expect(saved.size).toBe(0);
        expect(await store.has(id)).toBe(false);
    });
    it('does not create a file when quota is insufficient and cleans up a failed stream', async () => {
        const low = fixture(1);
        await expect(low.store.write(id, new NodeBlob(['x']) as unknown as Blob)).rejects.toThrow('Not enough');
        expect(low.saved.size).toBe(0);
        const failure = fixture(undefined, true);
        await expect(failure.store.write(id, new NodeBlob(['x']) as unknown as Blob)).rejects.toMatchObject({name: 'QuotaExceededError'});
        expect(failure.abort).toHaveBeenCalled();
        expect(failure.saved.size).toBe(0);
    });
    it('does not overwrite an existing asset or accept path traversal', async () => {
        const {store, saved} = fixture();
        await store.write(id, new NodeBlob(['x']) as unknown as Blob);
        await expect(store.write(id, new NodeBlob(['y']) as unknown as Blob)).rejects.toThrow('already in use');
        await expect(store.remove('../outside')).rejects.toThrow('Invalid');
        expect(saved.size).toBe(1);
    });
    it('aborts an interrupted copy between chunks and removes only the partial file', async () => {
        const {store, saved, abort, chunkSizes} = fixture();
        const controller = new AbortController();
        await expect(store.write(id, new NodeBlob([new Uint8Array(3 * 1024 * 1024)]) as unknown as Blob, () => controller.abort(), controller.signal)).rejects.toMatchObject({name: 'AbortError'});
        expect(chunkSizes).toHaveLength(1);
        expect(abort).toHaveBeenCalled();
        expect(saved.size).toBe(0);
    });
});
