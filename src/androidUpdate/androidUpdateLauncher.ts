import {Capacitor, registerPlugin} from '@capacitor/core';

export type AndroidUpdatePhase = 'idle' | 'permission-required' | 'pending' | 'downloading' | 'verifying' | 'ready' | 'failed';

export interface AndroidUpdateRequest {
    url: string;
    expectedSha256: string;
    expectedSize: number;
    expectedVersionName: string;
    expectedVersionCode: number;
}

export interface AndroidUpdateStatus {
    phase: AndroidUpdatePhase;
    downloadedBytes: number;
    totalBytes: number;
    percent?: number;
    reason?: string;
    staged: boolean;
    downloading: boolean;
}

interface NativeAndroidUpdatePlugin {
    downloadAndInstall(options: AndroidUpdateRequest): Promise<AndroidUpdateStatus>;
    getUpdateStatus(): Promise<AndroidUpdateStatus>;
    installPending(): Promise<AndroidUpdateStatus>;
    addListener(eventName: 'androidUpdateDownload', listener: (event: AndroidUpdateStatus) => void): Promise<{remove: () => Promise<void>}>;
}

const NativeAndroidUpdate = registerPlugin<NativeAndroidUpdatePlugin>('AndroidUpdate');

export interface AndroidUpdateLauncher {
    isNativeAndroid(): boolean;
    downloadAndInstall(request: AndroidUpdateRequest): Promise<AndroidUpdateStatus>;
    getUpdateStatus?(): Promise<AndroidUpdateStatus>;
    installPending?(): Promise<AndroidUpdateStatus>;
    addListener?(listener: (event: AndroidUpdateStatus) => void): Promise<{remove: () => Promise<void>}>;
}

const idleStatus: AndroidUpdateStatus = {
    phase: 'idle', downloadedBytes: 0, totalBytes: 0, staged: false, downloading: false,
};

export const androidUpdateLauncher: AndroidUpdateLauncher = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async downloadAndInstall(request) {
        if (!this.isNativeAndroid()) throw new Error('Android update download is only available in the installed Android app.');
        return NativeAndroidUpdate.downloadAndInstall(request);
    },
    async getUpdateStatus() {
        if (!this.isNativeAndroid()) return idleStatus;
        return NativeAndroidUpdate.getUpdateStatus();
    },
    async installPending() {
        if (!this.isNativeAndroid()) return idleStatus;
        return NativeAndroidUpdate.installPending();
    },
    async addListener(listener) {
        return NativeAndroidUpdate.addListener('androidUpdateDownload', listener);
    },
};
