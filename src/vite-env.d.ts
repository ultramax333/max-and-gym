/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_NUMBER__: string;
declare const __GIT_SHA__: string;
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_ENVIRONMENT__: string;

declare module 'virtual:pwa-register' {
    interface RegisterSWOptions {
        immediate?: boolean;
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
        onOfflineReady?: () => void;
        onNeedRefresh?: () => void;
        onRegisterError?: (error: unknown) => void;
    }
    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
