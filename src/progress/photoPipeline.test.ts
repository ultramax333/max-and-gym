import {describe, expect, it, vi} from 'vitest';
import {processPhoto, validatePhotoFile} from './photoPipeline';

describe('photo pipeline', () => {
    it('honours orientation-corrected dimensions, resizes and strips source metadata by re-encoding', async () => {
        const render = vi.fn(async (max: number, mime: string) => ({blob: new Blob([new Uint8Array(max === 2048 ? 1200 : 120)], {type: mime}), width: max === 2048 ? 1500 : 240, height: max === 2048 ? 2000 : 320}));
        const close = vi.fn();
        const source = new Blob([new Uint8Array(5000)], {type: 'image/jpeg'});
        const result = await processPhoto(source, async () => ({width: 3000, height: 4000, render, close}));
        expect(render).toHaveBeenNthCalledWith(1, 2048, 'image/webp', .84);
        expect(render).toHaveBeenNthCalledWith(2, 320, 'image/webp', .76);
        expect(result.image).toMatchObject({width: 1500, height: 2000});
        expect(result.storedByteSize).toBe(1320);
        expect(result.image.checksum).toHaveLength(64);
        expect(close).toHaveBeenCalledOnce();
    });

    it('rejects unsupported or oversized inputs before decode', () => {
        expect(() => validatePhotoFile(new Blob(['x'], {type: 'text/plain'}))).toThrow('Format image');
        expect(() => validatePhotoFile(new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], {type: 'image/jpeg'}))).toThrow('20 Mo');
    });

    it('falls back to JPEG when WebP encoding is unavailable', async () => {
        const render = vi.fn(async (_max: number, mime: string) => { if (mime === 'image/webp') throw new Error('unsupported'); return {blob: new Blob(['jpeg'], {type: mime}), width: 100, height: 100}; });
        const result = await processPhoto(new Blob(['source'], {type: 'image/jpeg'}), async () => ({width: 100, height: 100, render, close: () => undefined}));
        expect(result.image.blob.type).toBe('image/jpeg');
        expect(result.thumbnail.blob.type).toBe('image/jpeg');
    });
});
