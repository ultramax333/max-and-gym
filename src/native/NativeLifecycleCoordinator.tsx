import React, {useContext, useEffect, useRef, useState} from 'react';
import {Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import {DBContext} from '../context/dbContext';
import {recordDiagnostic} from '../diagnostics/service';
import {REST_TIMER_COMPLETE_EVENT, RestTimerAlarmRepository} from '../pwa/restTimerNotifications';
import {useWorkoutService} from '../workout/useWorkoutService';
import {restAlarmGateway, RestAlarmActionResult} from './restAlarmGateway';
import {hasNativeMigrationDecision, recordNativeMigrationDecision} from './nativeMigrationDecision';

export function NativeLifecycleCoordinator() {
    const service = useWorkoutService();
    const {db} = useContext(DBContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
    const routeRef = useRef(location.pathname);

    useEffect(() => {
        routeRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        if (!service || !db) return;
        let active = true;
        let removeListener: (() => Promise<void>) | undefined;
        let reconcileQueue: Promise<void> = Promise.resolve();

        const reconcile = async (action?: RestAlarmActionResult) => {
            try {
                const delivered = action?.action && action.timerId
                    ? await new RestTimerAlarmRepository(db).acknowledgeNativeDelivery(
                        action.timerId,
                        new Date(action.occurredAtEpochMs ?? Date.now()),
                        action.endsAtEpochMs,
                    )
                    : undefined;
                const snapshot = await service.recover();
                if (!active) return;
                if (delivered) {
                    window.dispatchEvent(new CustomEvent(REST_TIMER_COMPLETE_EVENT, {detail: {sessionId: delivered.sessionId, timerId: delivered.id}}));
                }
                if (snapshot && (routeRef.current === '/' || action?.action === 'open')) {
                    navigate('/workout/active', {replace: true});
                }
            } catch (error) {
                recordDiagnostic({level: 'error', subsystem: 'BOOT', code: 'BOOT_ACTIVE_SESSION_RECOVERY_FAILED', safeMessage: 'The active workout could not be restored after application launch.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            }
        };

        const enqueueReconcile = (action?: RestAlarmActionResult): Promise<void> => {
            reconcileQueue = reconcileQueue.catch(() => undefined).then(() => reconcile(action));
            return reconcileQueue;
        };

        if (restAlarmGateway.isNativeAndroid()) {
            const consumeAction = () => {
                void restAlarmGateway.consumeLastAction()
                    .then((action) => enqueueReconcile(action.action ? action : undefined))
                    .catch((error: unknown) => recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_STATE_INVALID', safeMessage: 'The native rest alarm action could not be reconciled.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}}));
            };
            const consumeWhenVisible = () => { if (document.visibilityState === 'visible') consumeAction(); };
            consumeAction();
            void restAlarmGateway.addActionListener((action) => void enqueueReconcile(action)).then((handle) => { removeListener = handle ? () => handle.remove() : undefined; });
            window.addEventListener('focus', consumeAction);
            document.addEventListener('visibilitychange', consumeWhenVisible);
            return () => {
                active = false;
                window.removeEventListener('focus', consumeAction);
                document.removeEventListener('visibilitychange', consumeWhenVisible);
                void removeListener?.();
            };
        }

        void enqueueReconcile();
        return () => {
            active = false;
            void removeListener?.();
        };
    }, [db, navigate, service]);

    useEffect(() => {
        if (!db || !restAlarmGateway.isNativeAndroid() || hasNativeMigrationDecision(localStorage)) return;
        // This decision deliberately does not inspect IndexedDB: DBGuard may have
        // already seeded plans or exercises before the first native render.
        setShowMigrationPrompt(true);
    }, [db]);

    const dismissMigrationPrompt = (decision: 'continue-local' | 'import-selected') => {
        recordNativeMigrationDecision(localStorage, decision);
        setShowMigrationPrompt(false);
    };

    return <Dialog open={showMigrationPrompt} aria-labelledby="native-migration-title">
        <DialogTitle id="native-migration-title">Bring your existing data?</DialogTitle>
        <DialogContent>
            <Alert severity="info" sx={{mb: 2}}>The Android app has separate local storage. Your web data remains untouched.</Alert>
            <Typography>Export a personal .maxgym backup from the web app, then import it here to keep workouts, programs and photos.</Typography>
        </DialogContent>
        <DialogActions sx={{p: 2, flexDirection: {xs: 'column-reverse', sm: 'row'}, alignItems: 'stretch'}}>
            <Button onClick={() => dismissMigrationPrompt('continue-local')}>Continue without import</Button>
            <Button variant="contained" onClick={() => { dismissMigrationPrompt('import-selected'); navigate('/backup'); }}>Import .maxgym backup</Button>
        </DialogActions>
    </Dialog>;
}
