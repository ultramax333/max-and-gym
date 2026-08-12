import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, MenuItem, Paper, Stack, TextField, Typography} from '@mui/material';
import {Add, FitnessCenter, Flag, NotificationsActive, Pause, PlayArrow, Remove, Save, SkipNext, SwapHoriz, Undo} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SecondaryButton, StatePanel} from '../../components/ui/UiPrimitives';
import {recordDiagnostic} from '../../diagnostics/service';
import {ActiveWorkoutSnapshot, ExercisePerformanceSummary} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';
import {ExerciseMediaAsset, LibraryExercise} from '../../exerciseCatalog/types';
import {useExerciseCatalog} from '../../exerciseCatalog/useExerciseCatalog';
import {resolveWorkoutExerciseMedia} from './workoutExerciseMedia';
import {getRestNotificationPermission, prepareRestTimerAudio, requestRestNotificationPermission, REST_TIMER_COMPLETE_EVENT, RestNotificationPermission} from '../../pwa/restTimerNotifications';
import {restAlarmGateway, RestAlarmCapabilities} from '../../native/restAlarmGateway';
import {elapsedSeconds, formatElapsedDuration} from '../../workout/elapsed';
import {parseNonNegativeDecimal} from './numericInput';
import {remainingRestSeconds} from './restTimerDisplay';

function formatTimer(seconds: number): string {
    const safe = Math.max(0, seconds);
    return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

function useRestSeconds(snapshot: ActiveWorkoutSnapshot | undefined): number {
    const [, setTick] = useState(Date.now());
    useEffect(() => {
        if (snapshot?.timer?.status !== 'running') return;
        setTick(Date.now());
        const interval = window.setInterval(() => setTick(Date.now()), 500);
        return () => window.clearInterval(interval);
    }, [snapshot?.timer?.endsAt, snapshot?.timer?.id, snapshot?.timer?.status]);
    return remainingRestSeconds(snapshot?.timer, Date.now());
}

function useWorkoutElapsedSeconds(snapshot: ActiveWorkoutSnapshot | undefined): number {
    const [tick, setTick] = useState(Date.now());
    useEffect(() => {
        if (!snapshot || (snapshot.session.status !== 'active' && snapshot.session.status !== 'paused')) return;
        const interval = window.setInterval(() => setTick(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, [snapshot]);
    return snapshot ? elapsedSeconds(snapshot.session, tick) : 0;
}

function WorkoutRestBar({snapshot, onChange}: {snapshot: ActiveWorkoutSnapshot; onChange: (next: ActiveWorkoutSnapshot) => void}) {
    const service = useWorkoutService();
    const remaining = useRestSeconds(snapshot);
    if (!snapshot.timer) return null;
    const paused = snapshot.timer.status === 'paused';
    return <Paper sx={{position: 'sticky', bottom: 0, zIndex: 10, p: 1.5, borderRadius: 0, borderLeft: 0, borderRight: 0}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack><Typography variant="overline">REST</Typography><Typography variant="h5" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatTimer(remaining)}</Typography></Stack>
            <Stack direction="row" alignItems="center">
                <IconButton aria-label="Remove 15 seconds" onClick={() => void service?.adjustTimer(snapshot.session.id, -15).then(onChange)}><Remove/></IconButton>
                <IconButton aria-label={paused ? 'Resume rest' : 'Pause rest'} onClick={() => void (paused ? service?.resumeTimer(snapshot.session.id) : service?.pauseTimer(snapshot.session.id))?.then(onChange)}>{paused ? <PlayArrow/> : <Pause/>}</IconButton>
                <IconButton aria-label="Add 15 seconds" onClick={() => void service?.adjustTimer(snapshot.session.id, 15).then(onChange)}><Add/></IconButton>
                <Button startIcon={<SkipNext/>} onClick={() => void service?.skipTimer(snapshot.session.id).then(onChange)}>Passer</Button>
            </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary">{restAlarmGateway.isNativeAndroid() ? 'Android schedules this alarm outside the app, with a 10-second sound and vibration.' : 'The 10-second alarm works while this page can run. Android may suspend a browser tab or installed PWA.'}</Typography>
    </Paper>;
}

export function ActiveWorkoutPage() {
    const service = useWorkoutService();
    const catalog = useExerciseCatalog();
    const navigate = useNavigate();
    const [snapshot, setSnapshot] = useState<ActiveWorkoutSnapshot>();
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const [finishOpen, setFinishOpen] = useState(false);
    const [loadInput, setLoadInput] = useState('0');
    const [reps, setReps] = useState(0);
    const [rir, setRir] = useState(2);
    const [exerciseMedia, setExerciseMedia] = useState<ExerciseMediaAsset[]>([]);
    const [exerciseDetails, setExerciseDetails] = useState<LibraryExercise>();
    const [previousPerformance, setPreviousPerformance] = useState<ExercisePerformanceSummary>();
    const [exerciseChangeNotice, setExerciseChangeNotice] = useState('');
    const [defaultLoadNotice, setDefaultLoadNotice] = useState('');
    const previousExerciseId = useRef<string>();
    const [notificationPermission, setNotificationPermission] = useState<RestNotificationPermission>(() => getRestNotificationPermission());
    const [nativeCapabilities, setNativeCapabilities] = useState<RestAlarmCapabilities>();
    const workoutElapsedSeconds = useWorkoutElapsedSeconds(snapshot);

    const refreshNativeCapabilities = useCallback(async () => {
        if (restAlarmGateway.isNativeAndroid()) setNativeCapabilities(await restAlarmGateway.getCapabilities());
    }, []);

    useEffect(() => {
        void refreshNativeCapabilities();
        const refreshOnVisible = () => { if (document.visibilityState === 'visible') void refreshNativeCapabilities(); };
        document.addEventListener('visibilitychange', refreshOnVisible);
        return () => document.removeEventListener('visibilitychange', refreshOnVisible);
    }, [refreshNativeCapabilities]);

    const refresh = useCallback(async () => {
        if (!service) return;
        setLoading(true);
        try {
            setSnapshot(await service.recover());
            setError(undefined);
        } catch {
            setError('Automatic recovery failed. Open Diagnostics before trying again.');
        } finally {
            setLoading(false);
        }
    }, [service]);

    useEffect(() => { void refresh(); }, [refresh]);
    useEffect(() => {
        const handleTimerComplete = () => void refresh();
        window.addEventListener(REST_TIMER_COMPLETE_EVENT, handleTimerComplete);
        return () => window.removeEventListener(REST_TIMER_COMPLETE_EVENT, handleTimerComplete);
    }, [refresh]);
    useEffect(() => {
        const reconcile = () => { if (document.visibilityState === 'visible') void refresh(); };
        document.addEventListener('visibilitychange', reconcile);
        window.addEventListener('focus', reconcile);
        return () => {
            document.removeEventListener('visibilitychange', reconcile);
            window.removeEventListener('focus', reconcile);
        };
    }, [refresh]);

    useEffect(() => {
        if (!snapshot || snapshot.session.status !== 'active' || !('wakeLock' in navigator)) return;
        let released = false;
        let sentinel: {release: () => Promise<void>} | undefined;
        const request = async () => {
            try {
                const wakeLock = (navigator as Navigator & {wakeLock: {request: (type: 'screen') => Promise<{release: () => Promise<void>}>}}).wakeLock;
                sentinel = await wakeLock.request('screen');
                if (released) await sentinel.release();
            } catch {
                recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Screen wake lock was unavailable during workout.'});
            }
        };
        void request();
        return () => {
            released = true;
            void sentinel?.release().catch(() => undefined);
        };
    }, [snapshot]);

    const currentSet = snapshot?.sets.find((entry) => entry.id === snapshot.session.currentSetId && entry.status !== 'completed');
    const currentExercise = snapshot?.exercises.find((entry) => entry.id === (currentSet?.sessionExerciseId ?? snapshot.session.currentSessionExerciseId));
    const completed = snapshot?.sets.filter((entry) => entry.status === 'completed') ?? [];
    const latestCompleted = [...completed].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
    const allSetsDone = Boolean(snapshot && snapshot.sets.every((entry) => entry.status === 'completed'));
    useEffect(() => {
        let cancelled = false;
        setExerciseMedia([]);
        setExerciseDetails(undefined);
        setPreviousPerformance(undefined);
        if (!catalog || !currentExercise) return () => { cancelled = true; };
        void Promise.all([
            resolveWorkoutExerciseMedia(catalog, currentExercise.exerciseId, currentExercise.exerciseNameSnapshot),
            catalog.get(currentExercise.exerciseId),
            service?.exerciseHistory(currentExercise.exerciseId, snapshot?.session.id),
        ]).then(([media, details, history]) => {
            if (!cancelled) { setExerciseMedia(media); setExerciseDetails(details); setPreviousPerformance(history); }
        });
        return () => { cancelled = true; };
    }, [catalog, currentExercise, service, snapshot?.session.id]);
    useEffect(() => {
        if (!currentExercise || !snapshot) return;
        const previous = previousExerciseId.current;
        previousExerciseId.current = currentExercise.id;
        if (!previous || previous === currentExercise.id) return;
        const exerciseNumber = snapshot.exercises.findIndex((entry) => entry.id === currentExercise.id) + 1;
        const exerciseSets = snapshot.sets.filter((entry) => entry.sessionExerciseId === currentExercise.id);
        const nextSet = exerciseSets.find((entry) => entry.id === snapshot.session.currentSetId);
        setExerciseChangeNotice(`Exercise changed — now ${currentExercise.exerciseNameSnapshot} (exercise ${exerciseNumber}/${snapshot.exercises.length}, set ${(nextSet?.sequenceIndex ?? 0) + 1}/${exerciseSets.length}).`);
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, [currentExercise, snapshot]);
    useEffect(() => {
        if (!currentSet) return;
        setLoadInput(String(currentSet.targetLoadKg));
        setReps(currentSet.targetRepsMin);
        setRir(currentSet.targetRir);
    }, [currentSet]);

    const perform = async (action: () => Promise<ActiveWorkoutSnapshot>) => {
        setBusy(true);
        try {
            setSnapshot(await action());
            setError(undefined);
            return true;
        } catch {
            setError('The write was not committed. Nothing was lost; you can retry.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const load = parseNonNegativeDecimal(loadInput);

    const start = async () => {
        if (!service) return;
        await perform(() => service.start());
    };

    if (loading) return <Layout title="Active workout" hideNav><LinearProgress aria-label="Loading workout"/></Layout>;
    if (!snapshot) return <Layout title="Active workout" hideNav><ScreenContainer>{error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}<StatePanel title="No active workout" description="Start the essential workout: two exercises and six sets, fully available offline." icon={<FitnessCenter/>} action={<PrimaryButton startIcon={<PlayArrow/>} onClick={() => void start()} disabled={busy}>Start</PrimaryButton>}/></ScreenContainer></Layout>;

    return <Layout title={snapshot.session.nameSnapshot} hideNav hideBack toolItems={<Chip label={snapshot.session.status === 'paused' ? 'Paused' : 'Active'} color={snapshot.session.status === 'paused' ? 'warning' : 'success'}/>}>
        <ScreenContainer>
            <Stack spacing={2}>
                {error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}
                {exerciseChangeNotice && <Alert severity="info" icon={<SwapHoriz/>} onClose={() => setExerciseChangeNotice('')} role="status">{exerciseChangeNotice}</Alert>}
                {defaultLoadNotice && <Alert severity="success" onClose={() => setDefaultLoadNotice('')} role="status">{defaultLoadNotice}</Alert>}
                {restAlarmGateway.isNativeAndroid() && nativeCapabilities && (nativeCapabilities.notificationPermission !== 'granted' || !nativeCapabilities.exactAlarmAllowed) && <Alert severity="warning" action={<Stack direction={{xs: 'column', sm: 'row'}} gap={1}>{nativeCapabilities.notificationPermission !== 'granted' && <Button startIcon={<NotificationsActive/>} onClick={() => void restAlarmGateway.requestNotificationPermission().then(setNativeCapabilities)}>Allow notifications</Button>}{!nativeCapabilities.exactAlarmAllowed && <Button onClick={() => void restAlarmGateway.requestExactAlarmPermission().then(() => refreshNativeCapabilities())}>Allow exact alarms</Button>}</Stack>}>Allow Android notifications and exact alarms so rest alerts fire reliably while the app is in the background.</Alert>}
                {!restAlarmGateway.isNativeAndroid() && notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && <Alert severity={notificationPermission === 'denied' ? 'warning' : 'info'} action={notificationPermission === 'default' ? <Button startIcon={<NotificationsActive/>} onClick={() => void requestRestNotificationPermission().then(setNotificationPermission)}>Enable</Button> : undefined}>{notificationPermission === 'denied' ? 'Rest notifications are blocked in Chrome site settings. The in-app alarm remains enabled.' : 'Enable rest notifications to be alerted while another app screen is open or Chrome is in the background.'}</Alert>}
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Stack>
                        <Typography color="text.secondary">{completed.length}/{snapshot.sets.length} sets completed</Typography>
                        <Typography variant="caption" color="text.secondary">Elapsed time: <Box component="span" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatElapsedDuration(workoutElapsedSeconds)}</Box></Typography>
                    </Stack>
                    <Button startIcon={snapshot.session.status === 'paused' ? <PlayArrow/> : <Pause/>} onClick={() => void perform(() => snapshot.session.status === 'paused' ? service!.resume(snapshot.session.id) : service!.pause(snapshot.session.id))}>{snapshot.session.status === 'paused' ? 'Resume' : 'Pause'}</Button>
                </Stack>
                <LinearProgress variant="determinate" value={(completed.length / snapshot.sets.length) * 100} aria-label="Workout progress"/>
                <TextField select fullWidth label="Rest for this session" value={snapshot.session.restOverrideSeconds ?? 'exercise-defaults'} disabled={busy} onChange={(event) => void perform(() => service!.setRestOverride(snapshot.session.id, event.target.value === 'exercise-defaults' ? undefined : Number(event.target.value)))} helperText="Applies to the next rest timer; the current timer is unchanged.">
                    <MenuItem value="exercise-defaults">Exercise defaults</MenuItem>
                    {[30, 45, 60, 90, 120, 150, 180, 240, 300].map((seconds) => <MenuItem key={seconds} value={seconds}>{seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)}${seconds % 60 ? ':30' : ':00'} min`}</MenuItem>)}
                </TextField>
                <Paper component="section" aria-labelledby="workout-plan-title" sx={{p: 2}}>
                    <Typography id="workout-plan-title" component="h2" variant="h6">Workout plan · {snapshot.exercises.length} exercises</Typography>
                    <Stack divider={<Divider flexItem/>} sx={{mt: 1}}>
                        {snapshot.exercises.map((exercise) => {
                            const exerciseSets = snapshot.sets.filter((entry) => entry.sessionExerciseId === exercise.id);
                            const completedSets = exerciseSets.filter((entry) => entry.status === 'completed').length;
                            const isCurrent = exercise.id === currentExercise?.id && !allSetsDone;
                            const canSwitch = !isCurrent && completedSets < exerciseSets.length;
                            return <Stack key={exercise.id} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} gap={1} sx={{py: 1}}>
                                <Stack minWidth={0}><Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap"><Typography fontWeight={700}>{exercise.exerciseNameSnapshot}</Typography>{exercise.groupTypeSnapshot && exercise.groupTypeSnapshot !== 'single' && <Chip size="small" variant="outlined" label={exercise.groupTypeSnapshot}/>}</Stack><Typography variant="body2" color="text.secondary">{exercise.prescriptionSnapshot}</Typography></Stack>
                                <Stack direction="row" gap={1} alignItems="center" justifyContent={{xs: 'space-between', sm: 'flex-end'}}><Chip size="small" color={isCurrent ? 'primary' : exercise.status === 'completed' ? 'success' : 'default'} label={isCurrent ? 'Current' : `${completedSets}/${exerciseSets.length} sets`}/>{canSwitch && <Button size="small" variant="outlined" startIcon={<SwapHoriz/>} disabled={busy} onClick={() => void perform(() => service!.switchExercise(snapshot.session.id, exercise.id))}>Switch here</Button>}</Stack>
                            </Stack>;
                        })}
                    </Stack>
                </Paper>
                {!allSetsDone && currentExercise && currentSet && <>
                    <Card>{exerciseMedia.length ? <Box sx={{display: 'grid', gridTemplateColumns: exerciseMedia.length > 1 ? '1fr 1fr' : '1fr', gap: '1px', bgcolor: 'divider'}}>{exerciseMedia.map((media) => <Box key={media.kind} component="img" src={`${import.meta.env.BASE_URL}${media.path}`} alt={media.altText} sx={{display: 'block', width: '100%', height: {xs: 180, sm: 260}, objectFit: 'contain', bgcolor: 'background.default'}}/>)}</Box> : <Box sx={{height: 180, display: 'grid', placeItems: 'center', bgcolor: 'background.default'}}><Stack alignItems="center"><FitnessCenter sx={{fontSize: 56, color: 'primary.main'}}/><Typography color="text.secondary">No local exercise photo</Typography></Stack></Box>}<CardContent><Typography variant="overline" color="primary">EXERCISE {snapshot.exercises.findIndex((entry) => entry.id === currentExercise.id) + 1} OF {snapshot.exercises.length}</Typography><Typography component="h1" variant="h4">{currentExercise.exerciseNameSnapshot}</Typography><Typography color="text.secondary">{currentExercise.prescriptionSnapshot}</Typography>{exerciseDetails && <Box sx={{mt: 2}}><Typography component="h2" variant="h6">How to move</Typography><Typography variant="body2" sx={{mt: 0.5}}>{exerciseDetails.setupInstructions}</Typography><Box component="ol" sx={{pl: 2.5, mt: 1, mb: 0}}>{exerciseDetails.executionSteps.slice(0, 2).map((step) => <Typography component="li" variant="body2" key={step} sx={{mb: 0.5}}>{step}</Typography>)}</Box>{exerciseDetails.breathingCue && <Typography variant="caption" color="text.secondary">Breathing: {exerciseDetails.breathingCue}</Typography>}</Box>}</CardContent></Card>
                    <Paper sx={{p: 2}}><Typography component="h2" variant="h6">Previous performance</Typography>{previousPerformance ? <Stack spacing={1} sx={{mt: 0.5}}><Typography color="text.secondary">{new Date(previousPerformance.performedAt).toLocaleDateString()} · {previousPerformance.sessionName}</Typography><Stack direction="row" gap={0.75} flexWrap="wrap">{previousPerformance.sets.map((set, index) => <Chip key={`${index}-${set.loadKg}-${set.reps}`} size="small" label={`${set.loadKg} kg × ${set.reps}`}/>)}</Stack><Typography variant="caption" color="primary">The latest working load ({previousPerformance.suggestedLoadKg} kg) was pre-filled for this session unless you saved another default.</Typography></Stack> : <Typography color="text.secondary">No completed performance for this exercise yet.</Typography>}</Paper>
                    <Paper sx={{p: 2}}><Stack spacing={2}><Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}><Stack direction="row" alignItems="center" gap={1}><Typography component="h2" variant="h6">Set {currentSet.sequenceIndex + 1}</Typography><Chip size="small" color={currentSet.setKind === 'warmup' ? 'info' : currentSet.setKind === 'drop' ? 'secondary' : 'default'} label={currentSet.setKind ?? 'working'}/></Stack><Chip label={`${currentSet.targetLoadKg} kg · ${currentSet.targetRepsMin}–${currentSet.targetRepsMax} reps`}/></Stack><Divider/>
                        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
                            <TextField fullWidth label="Actual load (kg)" type="number" value={loadInput} onFocus={(event) => event.target.select()} onChange={(event) => setLoadInput(event.target.value)} error={load === undefined} helperText={load === undefined ? 'Enter a load of 0 kg or more.' : undefined} inputProps={{inputMode: 'decimal', min: 0, step: 0.5}}/>
                            <TextField fullWidth label="Actual repetitions" type="number" value={reps} onChange={(event) => setReps(Number(event.target.value))} inputProps={{inputMode: 'numeric', min: 0, step: 1}}/>
                            <TextField fullWidth label="RIR (optionnel)" type="number" value={rir} onChange={(event) => setRir(Number(event.target.value))} inputProps={{inputMode: 'numeric', min: 0, max: 10, step: 1}}/>
                        </Stack>
                        <Button variant="outlined" startIcon={<Save/>} disabled={busy || load === undefined || (currentSet.setKind ?? 'working') !== 'working'} onClick={() => { if (load === undefined) return; void perform(() => service!.saveDefaultLoad(snapshot.session.id, currentExercise.id, load)).then((saved) => { if (saved) setDefaultLoadNotice(`${load} kg saved as the default for ${currentExercise.exerciseNameSnapshot}. All remaining working sets were updated.`); }); }}>Use {load ?? '—'} kg as default</Button>
                        <Typography variant="caption" color="text.secondary">This updates every remaining working set for this exercise and pre-fills the same load in future sessions.</Typography>
                        <PrimaryButton disabled={busy || snapshot.session.status === 'paused' || reps < 0 || load === undefined} onClick={() => { if (load === undefined) return; if (!restAlarmGateway.isNativeAndroid()) void prepareRestTimerAudio(); void perform(() => service!.completeSet({sessionId: snapshot.session.id, setId: currentSet.id, actualLoadKg: load, actualReps: reps, actualRir: rir})); }}>Complete set</PrimaryButton>
                    </Stack></Paper>
                </>}
                {allSetsDone && <StatePanel title="All sets are complete" description="Review the summary, then finish the workout. This action is safe to retry without creating duplicates." icon={<Flag/>}/>}
                <Stack direction={{xs: 'column', sm: 'row'}} gap={1}>
                    <SecondaryButton startIcon={<Undo/>} disabled={!latestCompleted || busy} onClick={() => latestCompleted && void perform(() => service!.undoSet(snapshot.session.id, latestCompleted.id))}>Undo last set</SecondaryButton>
                    <Button color="error" variant="outlined" startIcon={<Flag/>} onClick={() => setFinishOpen(true)}>Finish workout</Button>
                </Stack>
            </Stack>
        </ScreenContainer>
        <WorkoutRestBar snapshot={snapshot} onChange={setSnapshot}/>
        <Dialog open={finishOpen} onClose={() => setFinishOpen(false)}><DialogTitle>Finish workout?</DialogTitle><DialogContent><Typography>Remaining sets will stay incomplete in this summary.</Typography></DialogContent><DialogActions><Button onClick={() => setFinishOpen(false)}>Continue</Button><Button variant="contained" color="error" startIcon={<Flag/>} onClick={() => void perform(async () => { const result = await service!.finish(snapshot.session.id); navigate(`/workout/summary/${snapshot.session.id}`); return result; })}>Finish</Button></DialogActions></Dialog>
    </Layout>;
}
