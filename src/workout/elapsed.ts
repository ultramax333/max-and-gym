import {WorkoutSessionRecord} from './types';

export function elapsedSeconds(session: WorkoutSessionRecord, nowMs = Date.now()): number {
    if (session.elapsedSeconds !== undefined && (session.status === 'completed' || session.status === 'abandoned')) return Math.max(0, session.elapsedSeconds);
    const startedAtMs = new Date(session.startedAt).getTime();
    const endpointMs = session.status === 'paused' && session.pausedAt ? new Date(session.pausedAt).getTime() : nowMs;
    return Math.max(0, Math.floor((endpointMs - startedAtMs) / 1000) - session.pausedDurationSeconds);
}

export function formatElapsedDuration(seconds: number): string {
    const safe = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const remainder = safe % 60;
    return `${hours ? `${hours}:` : ''}${hours ? minutes.toString().padStart(2, '0') : minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}
