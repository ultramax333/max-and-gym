import React, {createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {registerSW} from 'virtual:pwa-register';
import {recordDiagnostic} from '../diagnostics/service';

interface PwaState {
    registered: boolean;
    controlling: boolean;
    updateWaiting: boolean;
    offlineReady: boolean;
    applyUpdate: () => Promise<void>;
    deferUpdate: () => void;
    recheck: () => Promise<void>;
}

const PwaContext = createContext<PwaState>({
    registered: false,
    controlling: false,
    updateWaiting: false,
    offlineReady: false,
    applyUpdate: async () => undefined,
    deferUpdate: () => undefined,
    recheck: async () => undefined,
});

export function PwaProvider({children}: {children: ReactElement}) {
    const [registered, setRegistered] = useState(false);
    const [controlling, setControlling] = useState(Boolean(navigator.serviceWorker?.controller));
    const [updateWaiting, setUpdateWaiting] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [updateServiceWorker, setUpdateServiceWorker] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const updater = registerSW({
            immediate: true,
            onRegistered() {
                setRegistered(true);
                setControlling(Boolean(navigator.serviceWorker.controller));
            },
            onOfflineReady() {
                setOfflineReady(true);
            },
            onNeedRefresh() {
                setUpdateWaiting(true);
                recordDiagnostic({level: 'info', subsystem: 'PWA', code: 'PWA_UPDATE_AVAILABLE', safeMessage: 'An application update is waiting.'});
            },
            onRegisterError(error: unknown) {
                recordDiagnostic({level: 'error', subsystem: 'PWA', code: 'PWA_REGISTRATION_FAILED', safeMessage: 'Service worker registration failed.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            },
        });
        setUpdateServiceWorker(() => updater);
    }, []);

    const applyUpdate = useCallback(async () => {
        if (!updateServiceWorker) return;
        try {
            const storedWorkout = localStorage.getItem('workoutContext');
            const activeWorkout = storedWorkout ? JSON.parse(storedWorkout) as {timeStarted?: string} : undefined;
            if (activeWorkout?.timeStarted) {
                setUpdateWaiting(true);
                recordDiagnostic({level: 'warning', subsystem: 'PWA', code: 'PWA_UPDATE_DEFERRED', safeMessage: 'The update was deferred because a workout is active.'});
                return;
            }
        } catch {
            setUpdateWaiting(true);
            recordDiagnostic({level: 'warning', subsystem: 'PWA', code: 'PWA_UPDATE_DEFERRED', safeMessage: 'The update was deferred because active state could not be verified.'});
            return;
        }
        await updateServiceWorker(true);
    }, [updateServiceWorker]);

    const deferUpdate = useCallback(() => {
        setUpdateWaiting(false);
        recordDiagnostic({level: 'info', subsystem: 'PWA', code: 'PWA_UPDATE_DEFERRED', safeMessage: 'The application update was deferred.'});
    }, []);

    const recheck = useCallback(async () => {
        const registration = await navigator.serviceWorker?.getRegistration();
        setRegistered(Boolean(registration));
        setControlling(Boolean(navigator.serviceWorker?.controller));
        setUpdateWaiting(Boolean(registration?.waiting));
        await registration?.update();
    }, []);

    const value = useMemo(() => ({registered, controlling, updateWaiting, offlineReady, applyUpdate, deferUpdate, recheck}), [registered, controlling, updateWaiting, offlineReady, applyUpdate, deferUpdate, recheck]);
    return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export const usePwa = () => useContext(PwaContext);
