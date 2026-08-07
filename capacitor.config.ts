import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'io.github.ultramax333.maxandgym',
    appName: 'Max & Gym',
    webDir: 'build-android',
    android: {
        allowMixedContent: false,
        captureInput: true,
    },
};

export default config;
