export type GymLocationId = 'tunnel' | 'lausanne-gare' | 'flon';
export type CrowdMode = 'auto' | 'force-quiet' | 'force-busy';
export type OccupancyLevel = 'quiet' | 'moderate' | 'busy';

export const GYM_LOCATIONS: Array<{id: GymLocationId; label: string; address: string}> = [
    {id: 'tunnel', label: 'NonStop Gym Tunnel', address: 'Rue de la Borde 3b'},
    {id: 'lausanne-gare', label: 'NonStop Gym Lausanne Gare', address: "Avenue d'Ouchy 3"},
    {id: 'flon', label: 'NonStop Gym Flon', address: 'Rue de Genève 8'},
];

type HourRange = readonly [start: number, end: number];
interface DailyProfile {busy: HourRange[]; moderate: HourRange[]}

// Local snapshots of the distinct shapes shown by NonStop Gym's official
// "Average Occupancy" charts. They intentionally use broad bands rather than
// pretending that a rolling historical graph is an exact live head count.
const weekday: Record<GymLocationId, DailyProfile> = {
    'lausanne-gare': {busy: [[12, 14], [16, 21]], moderate: [[6, 12], [14, 16], [21, 23]]},
    flon: {busy: [[11, 14], [17, 20]], moderate: [[6, 11], [14, 17], [20, 23]]},
    tunnel: {busy: [[12, 14], [16, 21]], moderate: [[5, 12], [14, 16], [21, 24]]},
};

const saturday: Record<GymLocationId, DailyProfile> = {
    'lausanne-gare': {busy: [[10, 17]], moderate: [[8, 10], [17, 21]]},
    flon: {busy: [[10, 13], [15, 17]], moderate: [[8, 10], [13, 15], [17, 22]]},
    tunnel: {busy: [[9, 20]], moderate: [[7, 9], [20, 23]]},
};

const sunday: Record<GymLocationId, DailyProfile> = {
    'lausanne-gare': {busy: [[10, 16]], moderate: [[8, 10], [16, 20]]},
    flon: {busy: [[10, 15]], moderate: [[8, 10], [15, 20]]},
    tunnel: {busy: [[10, 19]], moderate: [[8, 10], [19, 22]]},
};

function includesHour(ranges: HourRange[], hour: number): boolean {
    return ranges.some(([start, end]) => hour >= start && hour < end);
}

export function occupancyLevel(gymId: GymLocationId, date: Date, mode: CrowdMode = 'auto'): OccupancyLevel {
    if (mode === 'force-busy') return 'busy';
    if (mode === 'force-quiet') return 'quiet';
    const day = date.getDay();
    const profile = day === 6 ? saturday[gymId] : day === 0 ? sunday[gymId] : weekday[gymId];
    const hour = date.getHours() + date.getMinutes() / 60;
    if (includesHour(profile.busy, hour)) return 'busy';
    if (includesHour(profile.moderate, hour)) return 'moderate';
    return 'quiet';
}

export function occupancyLabel(level: OccupancyLevel): string {
    return level === 'busy' ? 'Peak hours' : level === 'moderate' ? 'Moderately busy' : 'Quiet hours';
}
