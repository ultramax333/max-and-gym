import {isVideoId} from './model';
import {recordDiagnostic} from '../diagnostics/service';

export interface VideoFileStore {
    supported(): boolean;
    write(assetId: string, file: Blob, onProgress?: (bytes: number) => void, signal?: AbortSignal): Promise<void>;
    read(assetId: string): Promise<Blob>;
    has(assetId: string): Promise<boolean>;
    remove(assetId: string): Promise<void>;
}
export function throwIfVideoImportAborted(signal?: AbortSignal): void {
    if (signal?.aborted) throw new DOMException('Import stopped.', 'AbortError');
}
function missing(error: unknown): boolean { return error instanceof DOMException && error.name === 'NotFoundError'; }
/** Dedicated OPFS directory; no paths or user filenames are used as storage keys. */
export class OpfsVideoFileStore implements VideoFileStore {
    constructor(private readonly storage: StorageManager | undefined = navigator.storage) {}
    supported(): boolean { return typeof this.storage?.getDirectory === 'function'; }
    private async directory(create = false): Promise<FileSystemDirectoryHandle> {
        if (!this.supported()) throw new Error('Private video storage is unavailable in this browser.');
        return (await this.storage!.getDirectory()).getDirectoryHandle('maxgym-personal-videos-v1', {create});
    }
    private key(id: string): string {
        if (!isVideoId(id)) throw new Error('Invalid video file reference.');
        return id + '.video';
    }
    async write(id: string, file: Blob, onProgress?: (bytes: number) => void, signal?: AbortSignal): Promise<void> {
        const name = this.key(id);
        throwIfVideoImportAborted(signal);
        const estimate = await this.storage?.estimate();
        if (estimate?.quota !== undefined && file.size + 8 * 1024 * 1024 > estimate.quota - (estimate.usage ?? 0)) {
            throw new Error('Not enough device storage for this video. Keep the original file and free some space.');
        }
        const directory = await this.directory(true);
        try { await directory.getFileHandle(name); throw new Error('This storage reference is already in use.'); }
        catch (error) { if (!missing(error)) throw error; }
        const handle = await directory.getFileHandle(name, {create: true});
        let writer: FileSystemWritableFileStream | undefined;
        try {
            writer = await handle.createWritable();
            // Bound memory independently of the video size and yield between writes.
            for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
                throwIfVideoImportAborted(signal);
                const end = Math.min(file.size, offset + 1024 * 1024);
                await writer.write(await file.slice(offset, end).arrayBuffer());
                onProgress?.(end);
            }
            throwIfVideoImportAborted(signal);
            await writer.close();
        } catch (error) {
            try { await writer?.abort(); } catch {
                recordDiagnostic({level: 'warning', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_STORAGE_FAILED', safeMessage: 'A stopped video stream could not be aborted.'});
            }
            try { await directory.removeEntry(name); } catch {
                recordDiagnostic({level: 'warning', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_STORAGE_FAILED', safeMessage: 'An incomplete private video copy could not be cleaned up.'});
            }
            throw error;
        }
    }
    async read(id: string): Promise<Blob> {
        return (await (await this.directory()).getFileHandle(this.key(id))).getFile();
    }
    async has(id: string): Promise<boolean> {
        if (!this.supported()) return false;
        try { await this.read(id); return true; }
        catch (error) { if (missing(error)) return false; throw error; }
    }
    async remove(id: string): Promise<void> {
        const name = this.key(id);
        try { await (await this.directory()).removeEntry(name); }
        catch (error) { if (!missing(error)) throw error; }
    }
}

export function videoMimeType(file: Pick<File, 'name' | 'type' | 'size'>): string {
    const extensions: Record<string, string> = {mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mov: 'video/quicktime'};
    const mime = (!file.type || file.type === 'application/octet-stream') ? extensions[file.name.split('.').pop()?.toLowerCase() ?? ''] : file.type;
    if (!file.size || file.size > 2 * 1024 * 1024 * 1024 || !Object.values(extensions).includes(mime)) {
        throw new Error('Choose a video up to 2 GB: MP4, WebM, Ogg or MOV. It must be playable on this device.');
    }
    return mime;
}
export function inspectVideo(file: Blob, signal?: AbortSignal): Promise<number | undefined> {
    throwIfVideoImportAborted(signal);
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        const finish = (error?: Error) => {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', aborted);
            video.onloadedmetadata = null; video.onerror = null;
            const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : undefined;
            video.removeAttribute('src'); video.load();
            URL.revokeObjectURL(url);
            if (error) reject(error); else resolve(duration);
        };
        const aborted = () => finish(new DOMException('Import stopped.', 'AbortError'));
        const timeout = setTimeout(() => finish(new Error('Video details could not be read. Try a playable MP4 or WebM file.')), 15000);
        signal?.addEventListener('abort', aborted, {once: true});
        video.preload = 'metadata';
        video.onloadedmetadata = () => finish(video.videoWidth > 0 && video.videoHeight > 0 ? undefined : new Error('No playable video track was found in this file.'));
        video.onerror = () => finish(new Error('This video cannot be played here. Try MP4 with H.264/AAC or WebM.'));
        video.src = url;
    });
}
