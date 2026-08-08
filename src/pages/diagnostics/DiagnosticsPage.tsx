import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography} from '@mui/material';
import {Alarm, Backup, BatteryAlert, BugReport, ContentCopy, DeleteOutline, Download, HealthAndSafety, NotificationsActive, Refresh, RestartAlt, Storage} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {buildIdentity} from '../../config/buildIdentity';
import {DBContext} from '../../context/dbContext';
import {clearDiagnosticEvents, listDiagnosticEvents, recordDiagnostic} from '../../diagnostics/service';
import {DiagnosticEvent} from '../../diagnostics/types';
import {runSelfTest, SelfTestResult} from '../../diagnostics/selfTest';
import {usePwa} from '../../pwa/PwaContext';
import {buildDiagnosticExport} from '../../diagnostics/export';
import {describeBatteryOptimization, describeNativeAlarmCapability, describeWorkoutRecovery, scheduleAndroidDiagnosticAlarm, WorkoutRecoveryDiagnostic} from '../../diagnostics/androidRuntime';
import {restAlarmGateway, RestAlarmCapabilities} from '../../native/restAlarmGateway';
import {useWorkoutService} from '../../workout/useWorkoutService';

function IdentityRow({label, value}: {label: string; value: string | number}) {
    return <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={{xs: 0, sm: 2}} sx={{minWidth: 0, py: .25}}><Typography color="text.secondary">{label}</Typography><Typography sx={{fontFamily: 'monospace', overflowWrap: 'anywhere', textAlign: {sm: 'right'}}}>{value}</Typography></Stack>;
}

export default function DiagnosticsPage() {
    const {db} = useContext(DBContext);
    const pwa = usePwa();
    const navigate = useNavigate();
    const workoutService = useWorkoutService();
    const [events, setEvents] = useState<DiagnosticEvent[]>([]);
    const [selfTest, setSelfTest] = useState<SelfTestResult>();
    const [storage, setStorage] = useState<{usage?: number; quota?: number}>({});
    const [databaseHealth, setDatabaseHealth] = useState({tableCount: 0, activeWorkouts: 0, activeTimers: 0, photoBytes: 0});
    const [nativeCapabilities, setNativeCapabilities] = useState<RestAlarmCapabilities>();
    const [recovery, setRecovery] = useState<WorkoutRecoveryDiagnostic>(() => describeWorkoutRecovery(undefined));
    const [androidMessage, setAndroidMessage] = useState<{severity: 'success' | 'info' | 'warning' | 'error'; text: string}>();
    const [androidBusy, setAndroidBusy] = useState(false);
    const diagnosticCategories = ['build identity', 'environment capabilities', 'database health and counts', 'PWA health', 'storage health', 'self-test results', 'redacted diagnostic events', 'network origins', 'feature status'];

    const refresh = useCallback(async () => {
        setEvents(await listDiagnosticEvents());
        if (navigator.storage?.estimate) setStorage(await navigator.storage.estimate());
        if (db) {
            const [activeWorkouts, activeTimers, media] = await Promise.all([db.workoutSession.where('status').anyOf('active', 'paused').count(), db.restTimer.where('status').equals('running').count(), db.mediaBlob.toArray()]);
            setDatabaseHealth({tableCount: db.tables.length, activeWorkouts, activeTimers, photoBytes: media.filter((entry) => entry.purpose.startsWith('progress-')).reduce((total, entry) => total + entry.byteSize, 0)});
        }
    }, [db]);

    useEffect(() => { void refresh(); }, [refresh]);

    const refreshNativeCapabilities = useCallback(async () => {
        try {
            setNativeCapabilities(await restAlarmGateway.getCapabilities());
        } catch (error) {
            recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Android alarm capabilities could not be inspected.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
        }
    }, []);

    useEffect(() => { void refreshNativeCapabilities(); }, [refreshNativeCapabilities]);

    const inspectRecovery = useCallback(async () => {
        if (!workoutService) return;
        setAndroidBusy(true);
        try {
            const snapshot = await workoutService.recover();
            setRecovery(describeWorkoutRecovery(snapshot));
            setAndroidMessage({severity: 'success', text: snapshot ? 'Persisted workout state was checked with the normal recovery path.' : 'No active or paused workout needs restoration.'});
            await refresh();
        } catch (error) {
            recordDiagnostic({level: 'warning', subsystem: 'WORKOUT', code: 'WORKOUT_RECOVERY_BLOCKED', safeMessage: 'Android recovery diagnostics could not restore the active workout.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            setAndroidMessage({severity: 'error', text: 'Recovery could not be checked. Open the recent events below before retrying.'});
        } finally {
            setAndroidBusy(false);
        }
    }, [refresh, workoutService]);

    useEffect(() => { void inspectRecovery(); }, [inspectRecovery]);

    const runAndroidAlarmTest = async () => {
        if (!workoutService) return;
        setAndroidBusy(true);
        try {
            const snapshot = await workoutService.recover();
            const result = await scheduleAndroidDiagnosticAlarm(restAlarmGateway, Boolean(snapshot));
            setRecovery(describeWorkoutRecovery(snapshot));
            if (result.status === 'blocked-active-workout') setAndroidMessage({severity: 'warning', text: 'Finish or abandon the active workout before testing an Android alarm. The test never replaces a workout timer.'});
            else if (result.status === 'scheduled') setAndroidMessage({severity: result.exactAlarmAllowed ? 'success' : 'warning', text: result.exactAlarmAllowed ? 'Test alarm scheduled in 5 seconds. Switch apps or lock the phone; it should ring for 10 seconds.' : 'Test notification was requested in 5 seconds. Exact alarms are disabled, so Android may delay it.'});
            else setAndroidMessage({severity: 'info', text: 'Android alarm testing is unavailable in this browser build.'});
        } catch (error) {
            recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'The Android diagnostic alarm could not be scheduled.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            setAndroidMessage({severity: 'error', text: 'The alarm test could not be scheduled. Check Android permissions and recent events.'});
        } finally {
            setAndroidBusy(false);
        }
    };

    return <Layout title="Diagnostics" hideNav scroll>
        <Stack spacing={2} sx={{p: 2, pb: 4, maxWidth: 820, mx: 'auto'}}>
            <Typography component="h1" variant="h4">Diagnostics</Typography>
            <Alert severity="info">Diagnostics remain on this device and exclude notes, loads, repetitions and measurements.</Alert>
            <Card><CardContent><Typography variant="h6" gutterBottom>Build identity</Typography>
                <IdentityRow label="Version" value={buildIdentity.appVersion}/><IdentityRow label="Git SHA" value={buildIdentity.gitSha}/>
                <IdentityRow label="Build" value={buildIdentity.buildTimestamp}/><IdentityRow label="Environment" value={buildIdentity.environment}/>
                <IdentityRow label="Base / export" value={`${buildIdentity.databaseSchemaVersion} / ${buildIdentity.exportFormatVersion}`}/>
                <IdentityRow label="Exercise / program seeds" value={`${buildIdentity.exerciseSeedVersion} / ${buildIdentity.programSeedVersion}`}/>
                <IdentityRow label="Generator / cache" value={`${buildIdentity.generatorVersion} / ${buildIdentity.cacheVersion}`}/>
            </CardContent></Card>
            <Card sx={{minWidth: 0}}><CardContent><Typography variant="h6" gutterBottom>PWA and storage</Typography>
                <IdentityRow label="Service worker" value={pwa.registered ? 'registered' : 'not registered'}/>
                <IdentityRow label="Controls page" value={pwa.controlling ? 'yes' : 'no'}/>
                <IdentityRow label="Update waiting" value={pwa.updateWaiting ? 'yes' : 'no'}/>
                <IdentityRow label="Offline ready" value={pwa.offlineReady ? 'yes' : 'no'}/>
                <IdentityRow label="Storage" value={`${storage.usage ?? 0} / ${storage.quota ?? 0} bytes`}/>
                <Button sx={{mt: 1, whiteSpace: 'normal', textAlign: 'left'}} startIcon={<Refresh/>} onClick={() => void pwa.recheck()}>Recheck service worker</Button>
                <Button sx={{mt: 1, whiteSpace: 'normal', textAlign: 'left'}} startIcon={<Storage/>} onClick={() => void navigator.storage?.persist?.().then(refresh)}>Request persistent storage</Button>
            </CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Database and workout recovery</Typography><IdentityRow label="Database open" value={db?.isOpen() ? 'yes' : 'no'}/><IdentityRow label="Schema / tables" value={`${db?.verno ?? 0} / ${databaseHealth.tableCount}`}/><IdentityRow label="Active workouts" value={databaseHealth.activeWorkouts}/><IdentityRow label="Active timers" value={databaseHealth.activeTimers}/><IdentityRow label="Photos and thumbnails" value={`${databaseHealth.photoBytes} bytes`}/></CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Capabilities</Typography><IdentityRow label="Wake lock" value={'wakeLock' in navigator ? 'yes' : 'no'}/><IdentityRow label="Vibration" value={'vibrate' in navigator ? 'yes' : 'no'}/><IdentityRow label="Notifications" value={'Notification' in globalThis ? 'yes' : 'no'}/><IdentityRow label="Storage estimate" value={'storage' in navigator ? 'yes' : 'no'}/><IdentityRow label="Share / download" value={`${'share' in navigator ? 'share' : 'unavailable'} / yes`}/></CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Android alarm and recovery</Typography>
                <IdentityRow label="Android runtime" value={nativeCapabilities?.nativeAndroid ? 'yes' : 'no'}/>
                <IdentityRow label="Notification permission" value={nativeCapabilities?.notificationPermission ?? 'checking'}/>
                <IdentityRow label="Exact alarms" value={describeNativeAlarmCapability(nativeCapabilities)}/>
                <IdentityRow label="Battery optimization" value={describeBatteryOptimization(Boolean(nativeCapabilities?.nativeAndroid))}/>
                <IdentityRow label="Persisted session" value={recovery.session}/><IdentityRow label="Persisted rest timer" value={recovery.timer}/>
                <Alert severity="info" sx={{mt: 1}}>The test never replaces a workout timer. It is available only when no active or paused workout is persisted.</Alert>
                {androidMessage && <Alert severity={androidMessage.severity} sx={{mt: 1}}>{androidMessage.text}</Alert>}
                <Stack direction={{xs: 'column', sm: 'row'}} gap={1} sx={{mt: 1}}>
                    {nativeCapabilities?.nativeAndroid && nativeCapabilities.notificationPermission !== 'granted' && <Button startIcon={<NotificationsActive/>} disabled={androidBusy} onClick={() => void restAlarmGateway.requestNotificationPermission().then(setNativeCapabilities).catch(() => setAndroidMessage({severity: 'error', text: 'Android notification permission could not be requested.'}))}>Allow notifications</Button>}
                    {nativeCapabilities?.nativeAndroid && !nativeCapabilities.exactAlarmAllowed && <Button startIcon={<Alarm/>} disabled={androidBusy} onClick={() => void restAlarmGateway.requestExactAlarmPermission().then(() => refreshNativeCapabilities()).catch(() => setAndroidMessage({severity: 'error', text: 'Android exact-alarm settings could not be opened.'}))}>Allow exact alarms</Button>}
                    <Button startIcon={<RestartAlt/>} disabled={androidBusy || !workoutService} onClick={() => void inspectRecovery()}>Check recovery now</Button>
                    <Button variant="contained" startIcon={<Alarm/>} disabled={androidBusy || !nativeCapabilities?.nativeAndroid} onClick={() => void runAndroidAlarmTest()}>Run 5-second alarm test</Button>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1} sx={{mt: 1}}><BatteryAlert fontSize="small" color="action"/><Typography variant="caption" color="text.secondary">For a real background check, lock the Pixel 9a or switch apps. Do not force-stop the app: Android intentionally cancels alarms after a force-stop.</Typography></Stack>
            </CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Non-destructive self-test</Typography>
                <Button variant="contained" startIcon={<HealthAndSafety/>} onClick={async () => setSelfTest(await runSelfTest(db))}>Run self-test</Button>
                {selfTest && <Stack spacing={1} sx={{mt: 2}}>{selfTest.checks.map((check) => <Stack key={check.id} direction="row" gap={1} alignItems="flex-start" sx={{minWidth: 0}}><Chip size="small" label={check.level} color={check.level === 'pass' ? 'success' : check.level === 'fail' ? 'error' : 'warning'}/><Typography sx={{overflowWrap: 'anywhere'}}>{check.message}</Typography></Stack>)}</Stack>}
            </CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Separate diagnostic export</Typography><Alert severity="success" sx={{mb: 1}}>Exact categories: {diagnosticCategories.join(' · ')}.</Alert><Typography color="text.secondary" sx={{mb: 2}}>No workout value, measurement, note, custom name, photo or binary data.</Typography><Button variant="contained" startIcon={<Download/>} onClick={async () => { if (!db) return; const result = await buildDiagnosticExport(db, selfTest); const url = URL.createObjectURL(result.blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }}>Export diagnostics</Button><Button sx={{ml: 1}} startIcon={<Backup/>} onClick={() => navigate('/backup')}>Open backup</Button></CardContent></Card>
            <Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">Recent events ({events.length})</Typography>
                <Button color="error" startIcon={<DeleteOutline/>} onClick={async () => { await clearDiagnosticEvents(); await refresh(); }}>Clear</Button></Stack>
                <Divider sx={{my: 1}}/>{events.length === 0 && <Typography color="text.secondary">No recorded event.</Typography>}
                <Stack spacing={1}>{events.slice(0, 20).map((event) => <Box key={event.id} sx={{p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1}}>
                    <Stack direction="row" justifyContent="space-between" gap={1}><Chip size="small" label={`${event.subsystem} · ${event.code}`} color={event.level === 'error' ? 'error' : 'default'}/><Typography variant="caption">{new Date(event.timestamp).toLocaleString()}</Typography></Stack>
                    <Typography sx={{my: .5}}>{event.safeMessage}</Typography><Stack direction="row" alignItems="center" gap={1}><Typography variant="caption" sx={{fontFamily: 'monospace'}}>{event.id}</Typography><Button size="small" startIcon={<ContentCopy/>} onClick={() => void navigator.clipboard?.writeText(event.id)}>Copy</Button></Stack>
                </Box>)}</Stack>
            </CardContent></Card>
            <Button color="warning" variant="outlined" startIcon={<BugReport/>} onClick={() => navigate('/diagnostics/error-test')}>Test route boundary</Button>
        </Stack>
    </Layout>;
}

export function IntentionalRouteError(): JSX.Element {
    throw new Error('Intentional diagnostics boundary test secret=must-not-leak');
}
