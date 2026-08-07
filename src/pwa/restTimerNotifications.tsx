import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {liveQuery} from 'dexie';
import {DBContext} from '../context/dbContext';
import {DexieDB} from '../db/db';
import {recordDiagnostic} from '../diagnostics/service';
import {RestTimerRecord} from '../workout/types';

export const REST_TIMER_COMPLETE_EVENT = 'max-gym-rest-timer-complete';
export type RestNotificationPermission = NotificationPermission | 'unsupported';

export function getRestNotificationPermission(): RestNotificationPermission {
    return 'Notification' in globalThis ? Notification.permission : 'unsupported';
}

function createAudioContext(): AudioContext | undefined {
    const AudioContextConstructor = globalThis.AudioContext;
    return AudioContextConstructor ? new AudioContextConstructor() : undefined;
}

export async function prepareRestTimerAudio(): Promise<void> {
    try {
        const context = createAudioContext();
        if (!context) return;
        await context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        gain.gain.value = 0;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.01);
        oscillator.addEventListener('ended', () => void context.close());
    } catch {
        recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Rest timer audio could not be prepared.'});
    }
}

export async function requestRestNotificationPermission(): Promise<RestNotificationPermission> {
    if (!('Notification' in globalThis)) return 'unsupported';
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') await prepareRestTimerAudio();
        return permission;
    } catch {
        recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Notification permission could not be requested.'});
        return getRestNotificationPermission();
    }
}

async function playRestAlarm(): Promise<void> {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 300]);
    try {
        const context = createAudioContext();
        if (!context) return;
        await context.resume();
        const gain = context.createGain();
        gain.gain.value = 0.1;
        gain.connect(context.destination);
        for (const [index, frequency] of [660, 880, 660].entries()) {
            const oscillator = context.createOscillator();
            oscillator.frequency.value = frequency;
            oscillator.connect(gain);
            oscillator.start(context.currentTime + index * 0.24);
            oscillator.stop(context.currentTime + index * 0.24 + 0.16);
        }
        window.setTimeout(() => void context.close(), 900);
    } catch {
        recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Rest timer audio feedback was unavailable.'});
    }
}

export async function showRestNotification(timer: RestTimerRecord, getRegistration: () => Promise<Pick<ServiceWorkerRegistration, 'showNotification'> | undefined> = () => navigator.serviceWorker?.getRegistration()): Promise<void> {
    if (getRestNotificationPermission() !== 'granted') return;
    try {
        const registration = await getRegistration();
        if (!registration) return;
        await registration.showNotification('Rest complete', {
            body: 'Time for your next set.',
            icon: `${import.meta.env.BASE_URL}logo192.png`,
            badge: `${import.meta.env.BASE_URL}logo192.png`,
            tag: `rest-timer-${timer.id}`,
            requireInteraction: true,
        });
    } catch {
        recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'The rest timer notification could not be displayed.'});
    }
}

export class RestTimerAlarmRepository {
    constructor(private readonly db: DexieDB) {}

    observeRunning(onNext: (timer: RestTimerRecord | undefined) => void, onError: () => void): () => void {
        const subscription = liveQuery(async () => {
            const timers = await this.db.restTimer.where('status').equals('running').toArray();
            return timers.sort((left, right) => left.endsAt.localeCompare(right.endsAt))[0];
        }).subscribe({next: onNext, error: onError});
        return () => subscription.unsubscribe();
    }

    async claimExpired(timerId: string, now = new Date()): Promise<RestTimerRecord | undefined> {
        return this.db.transaction('rw', this.db.restTimer, async () => {
            const timer = await this.db.restTimer.get(timerId);
            if (!timer || timer.status !== 'running' || timer.signalDeliveredAt || new Date(timer.endsAt).getTime() > now.getTime()) return undefined;
            const deliveredAt = now.toISOString();
            const completed = {...timer, status: 'completed' as const, signalDeliveredAt: deliveredAt, updatedAt: deliveredAt};
            await this.db.restTimer.put(completed);
            return completed;
        });
    }
}

export function RestTimerNotifier() {
    const {db} = useContext(DBContext);
    const repository = useMemo(() => db ? new RestTimerAlarmRepository(db) : undefined, [db]);
    const [timer, setTimer] = useState<RestTimerRecord>();

    useEffect(() => {
        if (!repository) return;
        return repository.observeRunning(setTimer, () => recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'The background rest timer monitor stopped.'}));
    }, [repository]);

    const deliver = useCallback(async () => {
        if (!repository || !timer) return;
        try {
            const completed = await repository.claimExpired(timer.id);
            if (!completed) return;
            window.dispatchEvent(new CustomEvent(REST_TIMER_COMPLETE_EVENT, {detail: {sessionId: completed.sessionId, timerId: completed.id}}));
            void Promise.allSettled([playRestAlarm(), showRestNotification(completed)]);
        } catch {
            recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_STATE_INVALID', safeMessage: 'The expired rest timer could not be reconciled.'});
        }
    }, [repository, timer]);

    useEffect(() => {
        if (!timer) return;
        const remaining = Math.max(0, new Date(timer.endsAt).getTime() - Date.now());
        const timeout = window.setTimeout(() => void deliver(), Math.min(remaining, 2_147_483_647));
        const reconcile = () => { if (new Date(timer.endsAt).getTime() <= Date.now()) void deliver(); };
        document.addEventListener('visibilitychange', reconcile);
        window.addEventListener('focus', reconcile);
        return () => {
            window.clearTimeout(timeout);
            document.removeEventListener('visibilitychange', reconcile);
            window.removeEventListener('focus', reconcile);
        };
    }, [deliver, timer]);

    return null;
}
