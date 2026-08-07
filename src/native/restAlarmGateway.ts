import {Capacitor, PluginListenerHandle, registerPlugin} from '@capacitor/core';
import {RestTimerRecord} from '../workout/types';

export type RestAlarmAction = 'fired' | 'open' | 'stop';

export interface RestAlarmCapabilities {
    nativeAndroid: boolean;
    notificationPermission: 'granted' | 'denied' | 'prompt' | 'unavailable';
    exactAlarmAllowed: boolean;
}

export interface RestAlarmActionResult {
    action?: RestAlarmAction;
    timerId?: string;
    occurredAtEpochMs?: number;
}

interface NativeRestAlarmPlugin {
    getCapabilities(): Promise<RestAlarmCapabilities>;
    requestNotificationPermission(): Promise<RestAlarmCapabilities>;
    requestExactAlarmPermission(): Promise<{opened: boolean; exactAlarmAllowed: boolean}>;
    schedule(options: {timerId: string; sessionId: string; endsAtEpochMs: number}): Promise<{scheduled: boolean; exactAlarmAllowed: boolean}>;
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
    async schedule(timer) {
        if (!this.isNativeAndroid()) return {scheduled: false, exactAlarmAllowed: false};
        return NativeRestAlarm.schedule({timerId: timer.id, sessionId: timer.sessionId, endsAtEpochMs: new Date(timer.endsAt).getTime()});
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
    if (timer?.status === 'running' && new Date(timer.endsAt).getTime() > Date.now()) {
        await gateway.schedule(timer);
        return;
    }
    await gateway.cancel(timer?.id ?? fallbackTimerId);
}
