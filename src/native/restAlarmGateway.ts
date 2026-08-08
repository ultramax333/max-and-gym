import {Capacitor, PluginListenerHandle, registerPlugin} from '@capacitor/core';
import {RestTimerRecord} from '../workout/types';

export type RestAlarmAction = 'fired' | 'open' | 'stop' | 'snooze';
export type RestAlarmTone = 'classic' | 'urgent' | 'silent';

export interface RestAlarmPreferences {
    durationSeconds: 5 | 10 | 20 | 30;
    vibrationEnabled: boolean;
    tone: RestAlarmTone;
}

export const DEFAULT_REST_ALARM_PREFERENCES: RestAlarmPreferences = {
    durationSeconds: 10,
    vibrationEnabled: true,
    tone: 'classic',
};

export function normalizeRestAlarmPreferences(value: Partial<RestAlarmPreferences>): RestAlarmPreferences {
    const durationSeconds = [5, 10, 20, 30].includes(value.durationSeconds ?? 0)
        ? value.durationSeconds as RestAlarmPreferences['durationSeconds']
        : DEFAULT_REST_ALARM_PREFERENCES.durationSeconds;
    const tone = value.tone === 'urgent' || value.tone === 'silent' || value.tone === 'classic'
        ? value.tone
        : DEFAULT_REST_ALARM_PREFERENCES.tone;
    return {
        durationSeconds,
        vibrationEnabled: typeof value.vibrationEnabled === 'boolean' ? value.vibrationEnabled : DEFAULT_REST_ALARM_PREFERENCES.vibrationEnabled,
        tone,
    };
}

export interface RestAlarmCapabilities {
    nativeAndroid: boolean;
    notificationPermission: 'granted' | 'denied' | 'prompt' | 'unavailable';
    exactAlarmAllowed: boolean;
}

export interface RestAlarmActionResult {
    action?: RestAlarmAction;
    timerId?: string;
    occurredAtEpochMs?: number;
    endsAtEpochMs?: number;
    generation?: string;
    previousEndsAtEpochMs?: number;
}

interface NativeRestAlarmPlugin {
    getCapabilities(): Promise<RestAlarmCapabilities>;
    requestNotificationPermission(): Promise<RestAlarmCapabilities>;
    requestExactAlarmPermission(): Promise<{opened: boolean; exactAlarmAllowed: boolean}>;
    getPreferences(): Promise<RestAlarmPreferences>;
    setPreferences(options: RestAlarmPreferences): Promise<RestAlarmPreferences>;
    schedule(options: {timerId: string; sessionId: string; endsAtEpochMs: number; generation: string}): Promise<{scheduled: boolean; exactAlarmAllowed: boolean}>;
    cancel(options: {timerId?: string}): Promise<void>;
    consumeLastAction(): Promise<RestAlarmActionResult>;
    addListener(eventName: 'restAlarmAction', listener: (event: RestAlarmActionResult) => void): Promise<PluginListenerHandle>;
}

const NativeRestAlarm = registerPlugin<NativeRestAlarmPlugin>('RestAlarm');

export interface RestAlarmGateway {
    isNativeAndroid(): boolean;
    getCapabilities(): Promise<RestAlarmCapabilities>;
    requestNotificationPermission(): Promise<RestAlarmCapabilities>;
    requestExactAlarmPermission(): Promise<{opened: boolean; exactAlarmAllowed: boolean}>;
    getPreferences(): Promise<RestAlarmPreferences>;
    setPreferences(preferences: RestAlarmPreferences): Promise<RestAlarmPreferences>;
    schedule(timer: Pick<RestTimerRecord, 'id' | 'sessionId' | 'endsAt'>): Promise<{scheduled: boolean; exactAlarmAllowed: boolean}>;
    cancel(timerId?: string): Promise<void>;
    consumeLastAction(): Promise<RestAlarmActionResult>;
    addActionListener(listener: (event: RestAlarmActionResult) => void): Promise<PluginListenerHandle | undefined>;
}

const unavailableCapabilities: RestAlarmCapabilities = {
    nativeAndroid: false,
    notificationPermission: 'unavailable',
    exactAlarmAllowed: false,
};

export const restAlarmGateway: RestAlarmGateway = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async getCapabilities() {
        return this.isNativeAndroid() ? NativeRestAlarm.getCapabilities() : unavailableCapabilities;
    },
    async requestNotificationPermission() {
        return this.isNativeAndroid() ? NativeRestAlarm.requestNotificationPermission() : unavailableCapabilities;
    },
    async requestExactAlarmPermission() {
        return this.isNativeAndroid() ? NativeRestAlarm.requestExactAlarmPermission() : {opened: false, exactAlarmAllowed: false};
    },
    async getPreferences() {
        return this.isNativeAndroid() ? normalizeRestAlarmPreferences(await NativeRestAlarm.getPreferences()) : DEFAULT_REST_ALARM_PREFERENCES;
    },
    async setPreferences(preferences) {
        if (!this.isNativeAndroid()) return normalizeRestAlarmPreferences(preferences);
        return normalizeRestAlarmPreferences(await NativeRestAlarm.setPreferences(normalizeRestAlarmPreferences(preferences)));
    },
    async schedule(timer) {
        if (!this.isNativeAndroid()) return {scheduled: false, exactAlarmAllowed: false};
        const endsAtEpochMs = new Date(timer.endsAt).getTime();
        return NativeRestAlarm.schedule({timerId: timer.id, sessionId: timer.sessionId, endsAtEpochMs, generation: `${timer.id}:${endsAtEpochMs}`});
    },
    async cancel(timerId) {
        if (this.isNativeAndroid()) await NativeRestAlarm.cancel({timerId});
    },
    async consumeLastAction() {
        return this.isNativeAndroid() ? NativeRestAlarm.consumeLastAction() : {};
    },
    async addActionListener(listener) {
        return this.isNativeAndroid() ? NativeRestAlarm.addListener('restAlarmAction', listener) : undefined;
    },
};

export async function syncNativeRestAlarm(timer: RestTimerRecord | undefined, gateway: RestAlarmGateway = restAlarmGateway, fallbackTimerId?: string): Promise<void> {
    if (!gateway.isNativeAndroid()) return;
    if (timer?.status === 'running' && Number.isFinite(new Date(timer.endsAt).getTime())) {
        await gateway.schedule(timer);
        return;
    }
    await gateway.cancel(timer?.id ?? fallbackTimerId);
}
