import {Capacitor, registerPlugin} from '@capacitor/core';

interface NativeAndroidUpdatePlugin {
    downloadAndInstall(options: {url: string}): Promise<{status: 'downloading' | 'permission-required'}>;
}

const NativeAndroidUpdate = registerPlugin<NativeAndroidUpdatePlugin>('AndroidUpdate');

export interface AndroidUpdateLauncher {
    isNativeAndroid(): boolean;
    downloadAndInstall(url: string): Promise<{status: 'downloading' | 'permission-required'}>;
}

export const androidUpdateLauncher: AndroidUpdateLauncher = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async downloadAndInstall(url) {
        if (!this.isNativeAndroid()) throw new Error('Android update download is only available in the installed Android app.');
        return NativeAndroidUpdate.downloadAndInstall({url});
    },
};
