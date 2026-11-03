export const LOCAL_VIDEOS_META_KEY = 'localWorkoutVideos:v1';
export const LOCAL_VIDEO_BACKUP_WARNING = 'A .maxgym backup saves video titles, body areas and difficulty, not the video files. Keep the originals separately and reattach them after restoring on another device.';
export const VIDEO_AREAS = [
    {id: 'abs', label: 'Abs / core'}, {id: 'back', label: 'Back'},
    {id: 'glutes', label: 'Glutes'}, {id: 'legs', label: 'Legs'},
    {id: 'arms', label: 'Arms'}, {id: 'shoulders', label: 'Shoulders'},
    {id: 'chest', label: 'Chest'}, {id: 'full-body', label: 'Full body'},
] as const;
export type VideoArea = typeof VIDEO_AREAS[number]['id'];
export interface LocalVideo {
    id: string;
    assetId: string;
    title: string;
    fileName: string;
    mimeType: string;
    byteSize: number;
    durationSeconds?: number;
    areas: VideoArea[];
    difficulty?: number;
    createdAt: string;
    updatedAt: string;
}
export interface VideoFilters {
    area: 'all' | 'unsorted' | VideoArea;
    difficulty: 'all' | 'unrated' | number;
    duration: 'all' | 'short' | 'medium' | 'long';
    search: string;
}
export const EMPTY_VIDEO_FILTERS: VideoFilters = {area: 'all', difficulty: 'all', duration: 'all', search: ''};
export function isVideoId(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function validateLocalVideo(video: LocalVideo): void {
    if (!video || !isVideoId(video.id ?? '') || !isVideoId(video.assetId ?? '')
        || typeof video.title !== 'string' || !video.title.trim() || video.title.length > 160
        || typeof video.fileName !== 'string' || video.fileName.length > 255
        || !['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'].includes(video.mimeType)
        || !Number.isSafeInteger(video.byteSize) || video.byteSize < 1
        || !Array.isArray(video.areas) || new Set(video.areas).size !== video.areas.length
        || video.areas.some(area => !VIDEO_AREAS.some(option => option.id === area))
        || (video.difficulty !== undefined && (!Number.isInteger(video.difficulty) || video.difficulty < 1 || video.difficulty > 5))
        || (video.durationSeconds !== undefined && (!Number.isFinite(video.durationSeconds) || video.durationSeconds <= 0 || video.durationSeconds > 86400))
        || typeof video.createdAt !== 'string' || typeof video.updatedAt !== 'string'
        || !Number.isFinite(Date.parse(video.createdAt)) || !Number.isFinite(Date.parse(video.updatedAt))) {
        throw new Error('The video details are invalid. Existing videos have not been changed.');
    }
}
export function parseLocalVideos(value?: string): LocalVideo[] {
    if (!value) return [];
    const videos: unknown = JSON.parse(value);
    if (!Array.isArray(videos) || videos.length > 1000) throw new Error('The local video library cannot be read.');
    videos.forEach(video => validateLocalVideo(video as LocalVideo));
    if (new Set(videos.map(video => video.id)).size !== videos.length || new Set(videos.map(video => video.assetId)).size !== videos.length) {
        throw new Error('The local video library contains conflicting references.');
    }
    return videos as LocalVideo[];
}
export function filterLocalVideos<T extends LocalVideo>(videos: T[], filters: VideoFilters): T[] {
    return videos.filter(video =>
        (filters.area === 'all' || (filters.area === 'unsorted' ? !video.areas.length : video.areas.includes(filters.area)))
        && (filters.difficulty === 'all' || (filters.difficulty === 'unrated' ? video.difficulty === undefined : video.difficulty === filters.difficulty))
        && (!filters.search.trim() || video.title.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase()))
        && (filters.duration === 'all' || (video.durationSeconds !== undefined
            && (filters.duration === 'short' ? video.durationSeconds <= 900 : filters.duration === 'medium' ? video.durationSeconds > 900 && video.durationSeconds <= 1800 : video.durationSeconds > 1800))));
}
