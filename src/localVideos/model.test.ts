import {describe, expect, it} from 'vitest';
import {EMPTY_VIDEO_FILTERS, filterLocalVideos, LocalVideo} from './model';

const base: LocalVideo = {id: '00000000-0000-4000-8000-000000000001', assetId: '00000000-0000-4000-8000-000000000002', title: 'Synthetic class', fileName: 'synthetic.mp4', mimeType: 'video/mp4', byteSize: 10, areas: [], createdAt: '2026-11-03T10:00:00Z', updatedAt: '2026-11-03T10:00:00Z'};
describe('personal video filters', () => {
    it('keeps unclassified videos in To sort and allows a video in several areas', () => {
        const sorted = {...base, id: 'other', areas: ['abs', 'back'] as const};
        const videos: LocalVideo[] = [base, {...sorted, areas: [...sorted.areas]}];
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, area: 'unsorted'})).toEqual([base]);
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, area: 'abs'})).toHaveLength(1);
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, area: 'back'})).toHaveLength(1);
    });
    it('combines title, duration and subjective difficulty without inventing unrated values', () => {
        const videos = [base, {...base, title: 'Hard abs', areas: ['abs'] as 'abs'[], difficulty: 5, durationSeconds: 1200}];
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, difficulty: 'unrated'})).toEqual([base]);
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, area: 'abs', search: 'ABS', difficulty: 5, duration: 'medium'})).toHaveLength(1);
        expect(filterLocalVideos(videos, {...EMPTY_VIDEO_FILTERS, duration: 'short'})).toEqual([]);
    });
});
