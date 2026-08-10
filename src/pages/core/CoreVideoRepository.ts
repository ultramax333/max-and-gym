import {DexieDB} from '../../db/db';
import {CORE_VIDEOS, CoreVideo, CoreVideoDuration, CUSTOM_CORE_VIDEOS_META_KEY, extractYouTubeId} from './coreVideos';

export {CUSTOM_CORE_VIDEOS_META_KEY} from './coreVideos';

export interface CustomCoreVideo extends CoreVideo {
    id: string;
    curated: false;
    createdAt: string;
    updatedAt: string;
}

export interface CustomCoreVideoInput {
    url: string;
    title: string;
    channel: string;
    durationMinutes: CoreVideoDuration;
    level: string;
    equipment: string;
    focus: string;
}

const durations = new Set<CoreVideoDuration>([10, 15, 20, 25, 30]);

function clean(value: string, maximum: number): string { return value.trim().slice(0, maximum); }

function normalizeStored(value: unknown): CustomCoreVideo[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is CustomCoreVideo => {
        if (!entry || typeof entry !== 'object') return false;
        const item = entry as Partial<CustomCoreVideo>;
        return typeof item.id === 'string' && typeof item.youtubeId === 'string' && extractYouTubeId(`https://www.youtube.com/watch?v=${item.youtubeId}`) === item.youtubeId &&
            typeof item.title === 'string' && typeof item.channel === 'string' && durations.has(item.durationMinutes as CoreVideoDuration) &&
            typeof item.level === 'string' && typeof item.equipment === 'string' && typeof item.focus === 'string' && item.curated === false;
    });
}

function normalizedInput(input: CustomCoreVideoInput): Omit<CustomCoreVideo, 'id' | 'createdAt' | 'updatedAt'> {
    const youtubeId = extractYouTubeId(input.url);
    const title = clean(input.title, 120);
    const channel = clean(input.channel, 80);
    if (!youtubeId) throw new Error('Enter a valid YouTube video URL.');
    if (!title) throw new Error('Video title is required.');
    if (!channel) throw new Error('Channel name is required.');
    if (!durations.has(input.durationMinutes)) throw new Error('Choose a supported duration.');
    return {youtubeId, title, channel, durationMinutes: input.durationMinutes, level: clean(input.level, 40) || 'All levels', equipment: clean(input.equipment, 80) || 'No equipment', focus: clean(input.focus, 120) || 'Core', curated: false};
}

export class CoreVideoRepository {
    constructor(private readonly db: DexieDB) {}

    async list(): Promise<CustomCoreVideo[]> {
        const record = await this.db.appMeta.get(CUSTOM_CORE_VIDEOS_META_KEY);
        if (!record) return [];
        try { return normalizeStored(JSON.parse(record.value)); }
        catch { return []; }
    }

    async create(input: CustomCoreVideoInput): Promise<CustomCoreVideo> {
        const now = new Date().toISOString();
        const item: CustomCoreVideo = {...normalizedInput(input), id: globalThis.crypto?.randomUUID?.() ?? `core-video-${Date.now()}`, createdAt: now, updatedAt: now};
        const current = await this.list();
        if (CORE_VIDEOS.some((entry) => entry.youtubeId === item.youtubeId) || current.some((entry) => entry.youtubeId === item.youtubeId)) throw new Error('This video is already in your library.');
        await this.write([...current, item]);
        return item;
    }

    async update(id: string, input: CustomCoreVideoInput): Promise<CustomCoreVideo> {
        const current = await this.list();
        const previous = current.find((entry) => entry.id === id);
        if (!previous) throw new Error('Video not found.');
        const next: CustomCoreVideo = {...previous, ...normalizedInput(input), updatedAt: new Date().toISOString()};
        if (CORE_VIDEOS.some((entry) => entry.youtubeId === next.youtubeId) || current.some((entry) => entry.id !== id && entry.youtubeId === next.youtubeId)) throw new Error('This video is already in your library.');
        await this.write(current.map((entry) => entry.id === id ? next : entry));
        return next;
    }

    async remove(id: string): Promise<void> { await this.write((await this.list()).filter((entry) => entry.id !== id)); }

    private async write(items: CustomCoreVideo[]): Promise<void> {
        if (items.length === 0) {
            await this.db.appMeta.delete(CUSTOM_CORE_VIDEOS_META_KEY);
            return;
        }
        const now = new Date().toISOString();
        await this.db.appMeta.put({key: CUSTOM_CORE_VIDEOS_META_KEY, value: JSON.stringify(items), updatedAt: now});
    }
}
