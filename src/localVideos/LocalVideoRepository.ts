import {DexieDB} from '../db/db';
import {LOCAL_VIDEOS_META_KEY, LocalVideo, parseLocalVideos} from './model';

export class LocalVideoRepository {
    constructor(private readonly db: DexieDB) {}
    async list(): Promise<LocalVideo[]> {
        return parseLocalVideos((await this.db.appMeta.get(LOCAL_VIDEOS_META_KEY))?.value);
    }
    async hasStoredMetadata(): Promise<boolean> {
        const value = (await this.db.appMeta.get(LOCAL_VIDEOS_META_KEY))?.value;
        return Boolean(value && value !== '[]');
    }
    private async change(mutator: (videos: LocalVideo[]) => LocalVideo[]): Promise<void> {
        await this.db.transaction('rw', this.db.appMeta, async () => {
            const videos = mutator(await this.list());
            if (videos.length > 1000) throw new Error('The library is full. Remove a video before importing another.');
            const value = JSON.stringify(videos);
            parseLocalVideos(value); // Validate the whole reference set, including uniqueness.
            await this.db.appMeta.put({key: LOCAL_VIDEOS_META_KEY, value, updatedAt: new Date().toISOString()});
        });
    }
    async add(video: LocalVideo): Promise<void> {
        await this.change(videos => {
            if (videos.some(entry => entry.id === video.id || entry.assetId === video.assetId)) throw new Error('This video is already saved.');
            return [...videos, video];
        });
    }
    async update(id: string, changes: Partial<Pick<LocalVideo, 'title' | 'areas' | 'difficulty' | 'durationSeconds' | 'assetId' | 'mimeType' | 'fileName' | 'byteSize'>>): Promise<LocalVideo> {
        let result: LocalVideo | undefined;
        await this.change(videos => {
            if (!videos.some(video => video.id === id)) throw new Error('This video is no longer in the library.');
            return videos.map(video => {
                if (video.id !== id) return video;
                result = {...video, ...changes, updatedAt: new Date().toISOString()};
                return result;
            });
        });
        if (!result) throw new Error('This video is no longer in the library.');
        return result;
    }
    async remove(id: string): Promise<LocalVideo> {
        let removed: LocalVideo | undefined;
        await this.change(videos => {
            if (!videos.some(video => video.id === id)) throw new Error('This video is no longer in the library.');
            return videos.filter(video => {
                if (video.id !== id) return true;
                removed = video;
                return false;
            });
        });
        if (!removed) throw new Error('This video is no longer in the library.');
        return removed;
    }
}
