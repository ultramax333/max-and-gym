import {RestTimerRecord} from '../../workout/types';

export function remainingRestSeconds(timer: RestTimerRecord | undefined, nowEpochMs: number): number {
    if (!timer) return 0;
    if (timer.status === 'paused') return timer.remainingWhenPausedSeconds ?? 0;
    return Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - nowEpochMs) / 1000));
}
