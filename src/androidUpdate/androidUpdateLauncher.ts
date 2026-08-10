import {Capacitor, registerPlugin} from '@capacitor/core';

interface NativeAndroidUpdatePlugin {
    downloadAndInstall(options: {url: string}): Promise<{status: 'downloading' | 'permission-required'}>;
    getUpdateStatus(): Promise<{staged: boolean; downloading: boolean}>;
    installPending(): Promise<{status: 'ready' | 'failed' | 'none'}>;
    addListener(eventName: 'androidUpdateDownload', listener: (event: {status: string}) => void): Promise<{remove: () => Promise<void>}>;
}

const NativeAndroidUpdate = registerPlugin<NativeAndroidUpdatePlugin>('AndroidUpdate');

export interface AndroidUpdateLauncher {
    isNativeAndroid(): boolean;
    downloadAndInstall(url: string): Promise<{status: 'downloading' | 'permission-required'}>;
    getUpdateStatus?(): Promise<{staged: boolean; downloading: boolean}>;
    installPending?(): Promise<{status: 'ready' | 'failed' | 'none'}>;
    addListener?(listener: (event: {status: string}) => void): Promise<{remove: () => Promise<void>}>;
}

export const androidUpdateLauncher: AndroidUpdateLauncher = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async downloadAndInstall(url) {
        if (!this.isNativeAndroid()) throw new Error('Android update download is only available in the installed Android app.');
        return NativeAndroidUpdate.downloadAndInstall({url});
    },
    async getUpdateStatus() {
        if (!this.isNativeAndroid()) return {staged: false, downloading: false};
        return NativeAndroidUpdate.getUpdateStatus();
    },
    async installPending() {
        if (!this.isNativeAndroid()) return {status: 'none'};
        return NativeAndroidUpdate.installPending();
    },
    async addListener(listener) {
        return NativeAndroidUpdate.addListener('androidUpdateDownload', listener);
    },
};
