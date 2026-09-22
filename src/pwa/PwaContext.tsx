import React, {createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {DBContext} from '../context/dbContext';
import {readAndroidUpdateBlockReason} from '../androidUpdate/updateSafety';
import {recordDiagnostic} from '../diagnostics/service';

interface PwaState {
    registered: boolean;
    controlling: boolean;
    updateWaiting: boolean;
    offlineReady: boolean;
    updateMessage?: string;
    applyUpdate: () => Promise<void>;
    deferUpdate: () => void;
    recheck: () => Promise<void>;
}
const PwaContext = createContext<PwaState>({registered: false, controlling: false, updateWaiting: false, offlineReady: false,
    applyUpdate: async () => undefined, deferUpdate: () => undefined, recheck: async () => undefined});

export function PwaProvider({children}: {children: ReactElement}) {
    const {db} = useContext(DBContext);
    const [registered, setRegistered] = useState(false);
    const [controlling, setControlling] = useState(Boolean(navigator.serviceWorker?.controller));
    const [updateWaiting, setUpdateWaiting] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<string>();

    useEffect(() => {
        if (!('serviceWorker' in navigator) || __BUILD_ENVIRONMENT__ === 'android' || import.meta.env.DEV) return;
        let disposed = false;
        let registration: ServiceWorkerRegistration | undefined;
        let worker: ServiceWorker | null = null;
        const stateChanged = () => {
            if (disposed || worker?.state !== 'installed') return;
            if (navigator.serviceWorker.controller) {
                setUpdateWaiting(true);
                recordDiagnostic({level: 'info', subsystem: 'PWA', code: 'PWA_UPDATE_AVAILABLE', safeMessage: 'An application update is waiting.'});
            } else setOfflineReady(true);
        };
        const updateFound = () => {
            worker?.removeEventListener('statechange', stateChanged);
            worker = registration?.installing ?? null;
            worker?.addEventListener('statechange', stateChanged);
        };
        // No controllerchange reload: another tab must not discard our drafts.
        void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(value => {
            if (disposed) return;
            registration = value;
            setRegistered(true);
            setControlling(Boolean(navigator.serviceWorker.controller));
            setUpdateWaiting(Boolean(value.waiting));
            value.addEventListener('updatefound', updateFound);
            updateFound();
        }).catch(() => {
            recordDiagnostic({level: 'error', subsystem: 'PWA', code: 'PWA_REGISTRATION_FAILED', safeMessage: 'Service worker registration failed.'});
        });
        return () => { disposed = true; worker?.removeEventListener('statechange', stateChanged); registration?.removeEventListener('updatefound', updateFound); };
    }, []);

    const applyUpdate = useCallback(async () => {
        if (!db) return;
        try {
            if (await readAndroidUpdateBlockReason(db)) {
                setUpdateMessage('Finish the active workout and any save or import before updating.');
                recordDiagnostic({level: 'info', subsystem: 'PWA', code: 'PWA_UPDATE_DEFERRED', safeMessage: 'Update deferred to protect active work.'});
                return;
            }
            // Natural activation after all tabs close protects unsaved forms and
            // writes across tabs. Never force worker activation or page reload.
            setUpdateMessage('Save your changes, then close all Max & Gym tabs and reopen the app to update.');
        } catch {
            setUpdateMessage('Could not check update safety. Save your work and try again.');
            recordDiagnostic({level: 'error', subsystem: 'PWA', code: 'PWA_UPDATE_FAILED', safeMessage: 'Update safety check failed.'});
        }
    }, [db]);
    const deferUpdate = useCallback(() => { setUpdateWaiting(false); setUpdateMessage(undefined); }, []);
    const recheck = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker?.getRegistration();
            setRegistered(Boolean(registration));
            setControlling(Boolean(navigator.serviceWorker?.controller));
            setUpdateWaiting(Boolean(registration?.waiting));
            await registration?.update();
        } catch {
            setUpdateMessage('Could not check for updates. Try again when online.');
            recordDiagnostic({level: 'error', subsystem: 'PWA', code: 'PWA_UPDATE_FAILED', safeMessage: 'Update check failed.'});
        }
    }, []);
    const value = useMemo(() => ({registered, controlling, updateWaiting, offlineReady, updateMessage, applyUpdate, deferUpdate, recheck}), [registered, controlling, updateWaiting, offlineReady, updateMessage, applyUpdate, deferUpdate, recheck]);
    return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
export const usePwa = () => useContext(PwaContext);
