import {describe, expect, it} from 'vitest';
import {CORE_VIDEOS, extractYouTubeId, isValidYouTubeId} from './coreVideos';

describe('curated core video catalogue', () => {
    it('contains one unique professional class for every supported duration', () => {
        expect(CORE_VIDEOS.map((video) => video.durationMinutes).sort((a, b) => a - b)).toEqual([10, 15, 20, 25, 30]);
        expect(new Set(CORE_VIDEOS.map((video) => video.youtubeId)).size).toBe(CORE_VIDEOS.length);
        expect(CORE_VIDEOS.every((video) => video.curated && isValidYouTubeId(video.youtubeId) && video.title && video.channel && video.focus)).toBe(true);
    });

    it('extracts supported YouTube URLs and direct IDs', () => {
        expect(extractYouTubeId('xsvLYAplbXw')).toBe('xsvLYAplbXw');
        expect(extractYouTubeId('https://youtu.be/xsvLYAplbXw?t=10')).toBe('xsvLYAplbXw');
        expect(extractYouTubeId('https://www.youtube.com/watch?v=xsvLYAplbXw')).toBe('xsvLYAplbXw');
        expect(extractYouTubeId('https://m.youtube.com/shorts/xsvLYAplbXw')).toBe('xsvLYAplbXw');
    });

    it('rejects deceptive domains, insecure URLs and invalid IDs', () => {
        expect(extractYouTubeId('https://youtube.example/watch?v=xsvLYAplbXw')).toBeUndefined();
        expect(extractYouTubeId('https://www.youtube.com.example/watch?v=xsvLYAplbXw')).toBeUndefined();
        expect(extractYouTubeId('http://www.youtube.com/watch?v=xsvLYAplbXw')).toBeUndefined();
        expect(extractYouTubeId('https://www.youtube.com/watch?v=short')).toBeUndefined();
    });
});
