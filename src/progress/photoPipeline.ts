export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_INPUT_BYTES = 20 * 1024 * 1024;

export class PhotoPipelineError extends Error {
    constructor(public readonly code: 'MEDIA_TYPE_INVALID' | 'MEDIA_SIZE_INVALID' | 'MEDIA_DECODE_FAILED' | 'MEDIA_COMPRESSION_FAILED', message: string) { super(message); this.name = 'PhotoPipelineError'; }
}

export interface DecodedPhoto {
    width: number;
    height: number;
    render(maxDimension: number, mimeType: 'image/webp' | 'image/jpeg', quality: number): Promise<{blob: Blob; width: number; height: number}>;
    close(): void;
}

export interface ProcessedPhoto {
    image: {blob: Blob; width: number; height: number; checksum: string};
    thumbnail: {blob: Blob; width: number; height: number; checksum: string};
    originalByteSize: number;
    storedByteSize: number;
}

export function validatePhotoFile(file: Blob): void {
    if (!PHOTO_MIME_TYPES.includes(file.type as typeof PHOTO_MIME_TYPES[number])) throw new PhotoPipelineError('MEDIA_TYPE_INVALID', 'Format image non pris en charge.');
    if (file.size <= 0 || file.size > MAX_PHOTO_INPUT_BYTES) throw new PhotoPipelineError('MEDIA_SIZE_INVALID', 'Image vide ou supérieure à 20 Mo.');
}

export async function checksumBlob(blob: Blob): Promise<string> {
    const bytes = typeof blob.arrayBuffer === 'function' ? await blob.arrayBuffer() : await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'));
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
    });
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | undefined> {
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? undefined), type, quality));
}

async function defaultDecode(file: Blob): Promise<DecodedPhoto> {
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'} as unknown as ImageBitmapOptions); }
    catch { throw new PhotoPipelineError('MEDIA_DECODE_FAILED', 'Impossible de décoder cette image.'); }
    return {
        width: bitmap.width,
        height: bitmap.height,
        async render(maxDimension, mimeType, quality) {
            const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
            const width = Math.max(1, Math.round(bitmap.width * scale));
            const height = Math.max(1, Math.round(bitmap.height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) throw new PhotoPipelineError('MEDIA_COMPRESSION_FAILED', 'Canvas image indisponible.');
            context.drawImage(bitmap, 0, 0, width, height);
            const encoded = await canvasBlob(canvas, mimeType, quality);
            if (!encoded?.size) throw new PhotoPipelineError('MEDIA_COMPRESSION_FAILED', 'Réencodage image impossible.');
            return {blob: encoded, width, height};
        },
        close: () => bitmap.close(),
    };
}

export async function processPhoto(file: Blob, decoder: (file: Blob) => Promise<DecodedPhoto> = defaultDecode): Promise<ProcessedPhoto> {
    validatePhotoFile(file);
    const decoded = await decoder(file);
    try {
        let image;
        try { image = await decoded.render(2048, 'image/webp', .84); }
        catch { image = await decoded.render(2048, 'image/jpeg', .86); }
        let thumbnail;
        try { thumbnail = await decoded.render(320, 'image/webp', .76); }
        catch { thumbnail = await decoded.render(320, 'image/jpeg', .8); }
        const [imageChecksum, thumbnailChecksum] = await Promise.all([checksumBlob(image.blob), checksumBlob(thumbnail.blob)]);
        return {image: {...image, checksum: imageChecksum}, thumbnail: {...thumbnail, checksum: thumbnailChecksum}, originalByteSize: file.size, storedByteSize: image.blob.size + thumbnail.blob.size};
    } finally { decoded.close(); }
}
