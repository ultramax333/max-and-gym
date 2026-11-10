import {recordDiagnostic} from '../diagnostics/service';
import {LocalVideoRepository} from './LocalVideoRepository';
import {LocalVideo} from './model';
import {inspectVideo, throwIfVideoImportAborted, VideoFileStore, videoMimeType} from './videoFiles';

export type AvailableLocalVideo = LocalVideo & {available: boolean};
export class LocalVideoService {
    constructor(
        readonly repository: LocalVideoRepository,
        readonly files: VideoFileStore,
        private readonly inspect: (file: Blob, signal?: AbortSignal) => Promise<number | undefined> = inspectVideo,
    ) {}
    async list(): Promise<AvailableLocalVideo[]> {
        return Promise.all((await this.repository.list()).map(async video => ({...video, available: await this.files.has(video.assetId)})));
    }
    async import(file: File, onProgress?: (bytes: number) => void, signal?: AbortSignal, replaceId?: string): Promise<LocalVideo> {
        const mimeType = videoMimeType(file);
        const durationSeconds = await this.inspect(file.slice(0, file.size, mimeType), signal);
        throwIfVideoImportAborted(signal);
        const assetId = crypto.randomUUID();
        await this.files.write(assetId, file, onProgress, signal);
        let saved: LocalVideo;
        let existing: LocalVideo | undefined;
        try {
            throwIfVideoImportAborted(signal);
            existing = replaceId ? (await this.repository.list()).find(video => video.id === replaceId) : undefined;
            if (replaceId && !existing) throw new Error('The video to reattach is no longer in your library.');
            const fileName = file.name.replaceAll('\\', '/').split('/').pop()!.slice(0, 255);
            const now = new Date().toISOString();
            if (existing) saved = await this.repository.update(existing.id, {assetId, fileName, byteSize: file.size, mimeType, durationSeconds: durationSeconds ?? existing.durationSeconds});
            else {
                saved = {id: crypto.randomUUID(), assetId, title: fileName.replace(/\.[^.]+$/, '').trim().slice(0, 160) || 'My video', fileName, mimeType, byteSize: file.size, durationSeconds, areas: [], createdAt: now, updatedAt: now};
                await this.repository.add(saved);
            }
        } catch (error) {
            await this.cleanup(assetId);
            throw error;
        }
        if (existing) await this.cleanup(existing.assetId);
        return saved;
    }
    private async cleanup(assetId: string): Promise<void> {
        try { await this.files.remove(assetId); }
        catch {
            recordDiagnostic({level: 'warning', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_STORAGE_FAILED', safeMessage: 'An unreferenced private video copy could not be cleaned up.'});
        }
    }
    async remove(id: string): Promise<void> {
        const video = await this.repository.remove(id);
        try { await this.files.remove(video.assetId); }
        catch (error) {
            // Restore the reference when cleanup fails so the owner can retry.
            await this.repository.add(video);
            throw error;
        }
    }
    async open(video: Pick<LocalVideo, 'assetId' | 'byteSize' | 'mimeType'>): Promise<Blob> {
        const blob = await this.files.read(video.assetId);
        if (blob.size !== video.byteSize) throw new Error('The stored copy is incomplete. Reattach the original video.');
        return blob.type === video.mimeType ? blob : blob.slice(0, blob.size, video.mimeType);
    }
}
