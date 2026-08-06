import {DexieDB} from '../db/db';
import {ProcessedPhoto} from './photoPipeline';
import {MediaBlobRecord, ProgressPhotoPose, ProgressPhotoRecord} from './types';

interface PhotoClock {now: () => Date; id: () => string}
const defaultClock: PhotoClock = {now: () => new Date(), id: () => globalThis.crypto.randomUUID()};

export class PhotoStorageError extends Error {
    constructor(public readonly code: 'STORAGE_QUOTA_EXCEEDED' | 'MEDIA_REFERENCE_MISSING', message: string) { super(message); this.name = 'PhotoStorageError'; }
}

export class PhotoRepository {
    constructor(private readonly db: DexieDB, private readonly clock: PhotoClock = defaultClock) {}

    async list(): Promise<ProgressPhotoRecord[]> { return (await this.db.progressPhoto.toArray()).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || b.id.localeCompare(a.id)); }
    async get(id: string): Promise<ProgressPhotoRecord | undefined> { return this.db.progressPhoto.get(id); }
    async media(id: string): Promise<MediaBlobRecord | undefined> { return this.db.mediaBlob.get(id); }
    async usageBytes(): Promise<number> { return (await this.db.mediaBlob.toArray()).reduce((total, entry) => total + entry.byteSize, 0); }

    async add(processed: ProcessedPhoto, input: {recordedAt: string; pose: ProgressPhotoPose; weightKg?: number; note: string; blurThumbnail: boolean}): Promise<ProgressPhotoRecord> {
        const now = this.clock.now().toISOString();
        const id = this.clock.id();
        const imageBlobId = this.clock.id();
        const thumbnailBlobId = this.clock.id();
        const image: MediaBlobRecord = {id: imageBlobId, purpose: 'progress-photo', blob: processed.image.blob, mimeType: processed.image.blob.type, width: processed.image.width, height: processed.image.height, byteSize: processed.image.blob.size, checksum: processed.image.checksum, createdAt: now};
        const thumbnail: MediaBlobRecord = {id: thumbnailBlobId, purpose: 'progress-thumbnail', blob: processed.thumbnail.blob, mimeType: processed.thumbnail.blob.type, width: processed.thumbnail.width, height: processed.thumbnail.height, byteSize: processed.thumbnail.blob.size, checksum: processed.thumbnail.checksum, createdAt: now};
        const photo: ProgressPhotoRecord = {id, ...input, note: input.note.trim(), imageBlobId, thumbnailBlobId, originalByteSize: processed.originalByteSize, storedByteSize: processed.storedByteSize, createdAt: now, updatedAt: now};
        try {
            await this.db.transaction('rw', [this.db.mediaBlob, this.db.progressPhoto], async () => { await this.db.mediaBlob.bulkAdd([image, thumbnail]); await this.db.progressPhoto.add(photo); });
        } catch (error) {
            const errorName = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
            if (errorName === 'QuotaExceededError') throw new PhotoStorageError('STORAGE_QUOTA_EXCEEDED', 'Stockage insuffisant. Exporte une sauvegarde puis supprime des photos inutiles.');
            throw error;
        }
        return photo;
    }

    async update(id: string, change: Partial<Pick<ProgressPhotoRecord, 'recordedAt' | 'pose' | 'weightKg' | 'note' | 'blurThumbnail'>>): Promise<void> {
        if (!(await this.db.progressPhoto.update(id, {...change, updatedAt: this.clock.now().toISOString()}))) throw new PhotoStorageError('MEDIA_REFERENCE_MISSING', 'Photo introuvable.');
    }

    async delete(id: string): Promise<void> {
        const photo = await this.db.progressPhoto.get(id);
        if (!photo) return;
        await this.db.transaction('rw', [this.db.mediaBlob, this.db.progressPhoto], async () => { await this.db.progressPhoto.delete(id); await this.db.mediaBlob.bulkDelete([photo.imageBlobId, photo.thumbnailBlobId]); });
    }

    async objectUrls(photo: ProgressPhotoRecord): Promise<{imageUrl: string; thumbnailUrl: string; release: () => void}> {
        const [image, thumbnail] = await Promise.all([this.db.mediaBlob.get(photo.imageBlobId), this.db.mediaBlob.get(photo.thumbnailBlobId)]);
        if (!image || !thumbnail) throw new PhotoStorageError('MEDIA_REFERENCE_MISSING', 'Image ou miniature manquante.');
        const imageUrl = URL.createObjectURL(image.blob);
        const thumbnailUrl = URL.createObjectURL(thumbnail.blob);
        return {imageUrl, thumbnailUrl, release: () => { URL.revokeObjectURL(imageUrl); URL.revokeObjectURL(thumbnailUrl); }};
    }
}
