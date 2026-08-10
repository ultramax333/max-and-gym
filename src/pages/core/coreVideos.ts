export type CoreVideoDuration = 10 | 15 | 20 | 25 | 30;
export const CUSTOM_CORE_VIDEOS_META_KEY = 'customCoreVideos:v1';

export interface CoreVideo {
    id: string;
    youtubeId: string;
    title: string;
    channel: string;
    durationMinutes: CoreVideoDuration;
    level: string;
    equipment: string;
    focus: string;
    curated: boolean;
}

export function isValidYouTubeId(value: string): boolean { return /^[A-Za-z0-9_-]{11}$/.test(value); }

export function extractYouTubeId(raw: string): string | undefined {
    const value = raw.trim();
    if (isValidYouTubeId(value)) return value;
    let url: URL;
    try { url = new URL(value); }
    catch { return undefined; }
    if (url.protocol !== 'https:') return undefined;
    const host = url.hostname.toLowerCase();
    let candidate: string | null | undefined;
    if (host === 'youtu.be') candidate = url.pathname.split('/').filter(Boolean)[0];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
        if (url.pathname === '/watch') candidate = url.searchParams.get('v');
        else if (/^\/(shorts|embed)\//.test(url.pathname)) candidate = url.pathname.split('/')[2];
    }
    return candidate && isValidYouTubeId(candidate) ? candidate : undefined;
}

export const CORE_VIDEOS: CoreVideo[] = [
    {id: 'curated:nml-beginner-10', youtubeId: 'xsvLYAplbXw', title: 'Beginner Core Workout', channel: 'Nourish Move Love', durationMinutes: 10, level: 'Beginner', equipment: 'No equipment', focus: 'Core foundations and stability', curated: true},
    {id: 'curated:nml-pilates-15', youtubeId: 'orh9UYtVvmc', title: 'Everyday Pilates Ab Workout', channel: 'Nourish Move Love', durationMinutes: 15, level: 'All levels', equipment: 'No equipment', focus: 'Pilates and deep core control', curated: true},
    {id: 'curated:nml-strength-20', youtubeId: 'XtPlxi03RAA', title: 'Core Strength and Stability', channel: 'Nourish Move Love', durationMinutes: 20, level: 'Intermediate', equipment: 'Dumbbells; bodyweight modifications', focus: 'Strength, stability and anti-rotation', curated: true},
    {id: 'curated:fb-abs-25', youtubeId: 'uB_ejT_DgUM', title: 'Abs and Obliques Workout', channel: 'Fitness Blender', durationMinutes: 25, level: 'Intermediate', equipment: 'No equipment', focus: 'Abs and obliques', curated: true},
    {id: 'curated:fb-core-cardio-30', youtubeId: 'IFB_au89KWE', title: 'Core and Cardio - No Repeats', channel: 'Fitness Blender', durationMinutes: 30, level: 'All levels', equipment: 'No equipment', focus: 'Abs, obliques, lower back and cardio', curated: true},
];
