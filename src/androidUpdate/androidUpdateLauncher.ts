import {Capacitor, registerPlugin} from '@capacitor/core';

interface NativeAndroidUpdatePlugin {
    openDownload(options: {url: string}): Promise<void>;
}

const NativeAndroidUpdate = registerPlugin<NativeAndroidUpdatePlugin>('AndroidUpdate');

export interface AndroidUpdateLauncher {
    isNativeAndroid(): boolean;
    openDownload(url: string): Promise<void>;
}

export const androidUpdateLauncher: AndroidUpdateLauncher = {
    isNativeAndroid: () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android',
    async openDownload(url) {
        if (!this.isNativeAndroid()) throw new Error('Android update download is only available in the installed Android app.');
        await NativeAndroidUpdate.openDownload({url});
    },
};
