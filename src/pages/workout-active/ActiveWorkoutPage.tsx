import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, MenuItem, Paper, Stack, TextField, Typography} from '@mui/material';
import {Close, ExpandMore, FitnessCenter, Flag, InfoOutlined, NotificationsActive, PlayArrow, Save, SwapHoriz, Undo} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SecondaryButton, StatePanel} from '../../components/ui/UiPrimitives';
import {recordDiagnostic} from '../../diagnostics/service';
import {ActiveWorkoutSnapshot, ExercisePerformanceSummary, SessionExerciseRecord} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';
import {ExerciseMediaAsset, LibraryExercise} from '../../exerciseCatalog/types';
import {useExerciseCatalog} from '../../exerciseCatalog/useExerciseCatalog';
import {resolveWorkoutExerciseMedia} from './workoutExerciseMedia';
import {getRestNotificationPermission, prepareRestTimerAudio, requestRestNotificationPermission, REST_TIMER_COMPLETE_EVENT, RestNotificationPermission} from '../../pwa/restTimerNotifications';
import {restAlarmGateway, RestAlarmCapabilities} from '../../native/restAlarmGateway';
import {elapsedSeconds, formatElapsedDuration} from '../../workout/elapsed';
import {parseNonNegativeDecimal} from './numericInput';
import {remainingRestSeconds} from './restTimerDisplay';
import {CompleteSetAction, ExerciseRail, MetricStepper, RestAction, WorkoutActionBar, WorkoutProgressHeader} from './ActiveWorkoutUi';

function formatTimer(seconds: number): string {
    const safe = Math.max(0, seconds);
    return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

function shortInstruction(value: string): string {
    const firstSentence = value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    if (firstSentence && firstSentence.length <= 180) return firstSentence;
    return value.length <= 180 ? value : `${value.slice(0, 177).trimEnd()}…`;
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
    const [repsInput, setRepsInput] = useState('0');
    const [rir, setRir] = useState(2);
    const [exerciseMedia, setExerciseMedia] = useState<ExerciseMediaAsset[]>([]);
    const [exerciseDetails, setExerciseDetails] = useState<LibraryExercise>();
    const [previousPerformance, setPreviousPerformance] = useState<ExercisePerformanceSummary>();
    const [exerciseChangeNotice, setExerciseChangeNotice] = useState('');
    const [defaultLoadNotice, setDefaultLoadNotice] = useState('');
    const [instructionsOpen, setInstructionsOpen] = useState(false);
    const [planOpen, setPlanOpen] = useState(true);
    const previousExerciseId = useRef<string>();
    const [notificationPermission, setNotificationPermission] = useState<RestNotificationPermission>(() => getRestNotificationPermission());
    const [nativeCapabilities, setNativeCapabilities] = useState<RestAlarmCapabilities>();
    const workoutElapsedSeconds = useWorkoutElapsedSeconds(snapshot);
    const restSeconds = useRestSeconds(snapshot);

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
        return () => { released = true; void sentinel?.release().catch(() => undefined); };
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
        setInstructionsOpen(false);
        document.querySelector('main')?.scrollTo({top: 0, behavior: 'smooth'});
    }, [currentExercise, snapshot]);

    useEffect(() => {
        if (!currentSet) return;
        setLoadInput(String(currentSet.targetLoadKg));
        setRepsInput(String(currentSet.targetRepsMin));
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

    const start = async () => {
        if (service) await perform(() => service.start());
    };

    if (loading) return <Layout title="Active workout" hideNav><LinearProgress aria-label="Loading workout"/></Layout>;
    if (!snapshot) return <Layout title="Active workout" hideNav><ScreenContainer>{error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}<StatePanel title="No active workout" description="Start the essential workout: two exercises and six sets, fully available offline." icon={<FitnessCenter/>} action={<PrimaryButton startIcon={<PlayArrow/>} onClick={() => void start()} disabled={busy}>Start</PrimaryButton>}/></ScreenContainer></Layout>;

    const load = parseNonNegativeDecimal(loadInput);
    const reps = parseNonNegativeDecimal(repsInput);
    const validReps = reps !== undefined && Number.isInteger(reps);
    const unfinishedExercises = snapshot.exercises.filter((exercise) => snapshot.sets.some((set) => set.sessionExerciseId === exercise.id && set.status !== 'completed'));
    const currentUnfinishedIndex = currentExercise ? unfinishedExercises.findIndex((exercise) => exercise.id === currentExercise.id) : -1;
    const canSwitchExercise = unfinishedExercises.length > 1 && currentUnfinishedIndex >= 0;
    const currentExerciseSets = currentExercise ? snapshot.sets.filter((entry) => entry.sessionExerciseId === currentExercise.id) : [];

    const switchToExercise = (exercise: SessionExerciseRecord) => {
        if (service) void perform(() => service.switchExercise(snapshot.session.id, exercise.id));
    };
    const switchNeighborExercise = (direction: -1 | 1) => {
        if (!canSwitchExercise) return;
        const nextIndex = (currentUnfinishedIndex + direction + unfinishedExercises.length) % unfinishedExercises.length;
        switchToExercise(unfinishedExercises[nextIndex]);
    };
    const completeCurrentSet = () => {
        if (!service || !currentSet || load === undefined || reps === undefined || !Number.isInteger(reps)) return;
        if (!restAlarmGateway.isNativeAndroid()) void prepareRestTimerAudio();
        void perform(() => service.completeSet({sessionId: snapshot.session.id, setId: currentSet.id, actualLoadKg: load, actualReps: reps, actualRir: rir}));
    };

    return <Layout title={snapshot.session.nameSnapshot} hideAppBar hideNav>
        <WorkoutProgressHeader
            sessionName={snapshot.session.nameSnapshot}
            elapsed={formatElapsedDuration(workoutElapsedSeconds)}
            completedSets={completed.length}
            totalSets={snapshot.sets.length}
            paused={snapshot.session.status === 'paused'}
            busy={busy}
            onBack={() => navigate('/train')}
            onTogglePause={() => void perform(() => snapshot.session.status === 'paused' ? service!.resume(snapshot.session.id) : service!.pause(snapshot.session.id))}
        />
        <ExerciseRail snapshot={snapshot} currentExercise={currentExercise} busy={busy} onSelect={switchToExercise}/>
        <Box sx={{width: '100%', maxWidth: 720, mx: 'auto', px: 2, pb: snapshot.timer ? 'calc(220px + env(safe-area-inset-bottom))' : 'calc(132px + env(safe-area-inset-bottom))'}}>
            <Stack spacing={1.5}>
                {error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}
                {exerciseChangeNotice && <Alert severity="info" icon={<SwapHoriz/>} onClose={() => setExerciseChangeNotice('')} role="status">{exerciseChangeNotice}</Alert>}
                {defaultLoadNotice && <Alert severity="success" onClose={() => setDefaultLoadNotice('')} role="status">{defaultLoadNotice}</Alert>}
                {restAlarmGateway.isNativeAndroid() && nativeCapabilities && (nativeCapabilities.notificationPermission !== 'granted' || !nativeCapabilities.exactAlarmAllowed) && <Alert severity="warning" action={<Stack direction={{xs: 'column', sm: 'row'}} gap={1}>{nativeCapabilities.notificationPermission !== 'granted' && <Button startIcon={<NotificationsActive/>} onClick={() => void restAlarmGateway.requestNotificationPermission().then(setNativeCapabilities)}>Allow notifications</Button>}{!nativeCapabilities.exactAlarmAllowed && <Button onClick={() => void restAlarmGateway.requestExactAlarmPermission().then(() => refreshNativeCapabilities())}>Allow exact alarms</Button>}</Stack>}>Allow Android notifications and exact alarms so rest alerts fire reliably while the app is in the background.</Alert>}
                {!restAlarmGateway.isNativeAndroid() && notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && <Alert severity={notificationPermission === 'denied' ? 'warning' : 'info'} action={notificationPermission === 'default' ? <Button startIcon={<NotificationsActive/>} onClick={() => void requestRestNotificationPermission().then(setNotificationPermission)}>Enable</Button> : undefined}>{notificationPermission === 'denied' ? 'Rest notifications are blocked in Chrome site settings. The in-app alarm remains enabled.' : 'Enable rest notifications to be alerted while another app screen is open or Chrome is in the background.'}</Alert>}

                {!allSetsDone && currentExercise && currentSet && <>
                    <Box sx={{height: {xs: 238, sm: 320}, borderRadius: '24px', overflow: 'hidden', position: 'relative', bgcolor: '#111A24', border: '1px solid rgba(255,255,255,.08)'}}>
                        {exerciseMedia.length ? <Box sx={{height: '100%', display: 'grid', gridTemplateColumns: exerciseMedia.length > 1 ? '1fr 1fr' : '1fr', gap: '1px', bgcolor: 'divider'}}>{exerciseMedia.map((media) => <Box key={`${media.kind}-${media.path}`} component="img" src={`${import.meta.env.BASE_URL}${media.path}`} alt={media.altText} sx={{display: 'block', width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'background.default'}}/>)}</Box> : <Box sx={{height: '100%', display: 'grid', placeItems: 'center'}}><Stack alignItems="center"><FitnessCenter sx={{fontSize: 56, color: 'primary.main'}}/><Typography color="text.secondary">No local exercise photo</Typography></Stack></Box>}
                        <Box sx={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 56%, rgba(6,9,13,.92) 100%)'}}/>
                        {exerciseDetails && <Stack direction="row" gap={0.75} sx={{position: 'absolute', left: 14, bottom: 14}}><Chip size="small" label={exerciseDetails.primaryMuscles[0] ?? exerciseDetails.movementPattern}/><Chip size="small" variant="outlined" label={exerciseDetails.equipmentTags[0] ?? 'Bodyweight'}/></Stack>}
                    </Box>

                    <Box>
                        <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap"><Typography variant="overline" color="primary.main">EXERCISE {snapshot.exercises.findIndex((entry) => entry.id === currentExercise.id) + 1} OF {snapshot.exercises.length}</Typography><Typography component="h2" variant="overline" color="primary.main">Set {currentSet.sequenceIndex + 1}</Typography><Typography variant="overline" color="text.secondary">OF {currentExerciseSets.length}</Typography></Stack>
                        <Typography component="h1" sx={{fontSize: {xs: 27, sm: 32}, fontWeight: 850, letterSpacing: '-.03em', lineHeight: 1.12}}>{currentExercise.exerciseNameSnapshot}</Typography>
                        <Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap" sx={{mt: 0.75}}><Chip size="small" label={`${currentSet.targetLoadKg} kg · ${currentSet.targetRepsMin}–${currentSet.targetRepsMax} reps`}/><Chip size="small" variant="outlined" label={currentSet.setKind ?? 'working'}/></Stack>
                    </Box>

                    <Paper sx={{p: 1.5, bgcolor: 'rgba(126,161,248,.07)', borderColor: 'rgba(126,161,248,.2)'}}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Box><Typography variant="caption" color="text.secondary">LAST SESSION</Typography>{previousPerformance ? <Typography fontWeight={750}>{previousPerformance.sets.map((set) => `${set.loadKg} kg × ${set.reps}`).join(' · ')}</Typography> : <Typography color="text.secondary">No previous performance</Typography>}</Box>
                            <Chip size="small" color="secondary" variant="outlined" label="Previous"/>
                        </Stack>
                    </Paper>

                    {exerciseDetails && <Paper sx={{p: 1.5, bgcolor: '#101720'}}>
                        <Stack direction="row" gap={1} alignItems="flex-start"><InfoOutlined color="primary" fontSize="small"/><Box sx={{flex: 1}}><Typography component="h2" fontWeight={750}>How to move</Typography><Typography variant="body2" color="text.secondary">{shortInstruction(exerciseDetails.setupInstructions)}</Typography></Box><IconButton aria-label={instructionsOpen ? 'Hide technique' : 'Show technique'} onClick={() => setInstructionsOpen((open) => !open)}>{instructionsOpen ? <Close/> : <ExpandMore/>}</IconButton></Stack>
                        <Collapse in={instructionsOpen}><Box component="ol" sx={{pl: 3, mb: 0}}>{exerciseDetails.executionSteps.slice(0, 3).map((step) => <Typography component="li" variant="body2" key={step} sx={{mt: 1}}>{step}</Typography>)}{exerciseDetails.breathingCue && <Typography component="li" variant="body2" sx={{mt: 1}}>Breathing: {exerciseDetails.breathingCue}</Typography>}</Box></Collapse>
                    </Paper>}

                    <Stack direction="row" gap={1.25}>
                        <MetricStepper label="Load" value={loadInput} unit="kg" step={0.5} error={load === undefined} onChange={setLoadInput}/>
                        <MetricStepper label="Repetitions" value={repsInput} unit="reps" step={1} error={!validReps} onChange={setRepsInput}/>
                    </Stack>
                    {(load === undefined || !validReps) && <Typography variant="caption" color="error.main">Enter a valid load and a whole number of repetitions.</Typography>}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                        <TextField select size="small" label="RIR" value={rir} onChange={(event) => setRir(Number(event.target.value))} sx={{width: 110}}>{Array.from({length: 11}, (_, value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
                        <Button variant="text" startIcon={<Save/>} disabled={busy || load === undefined || (currentSet.setKind ?? 'working') !== 'working'} onClick={() => { if (load === undefined) return; void perform(() => service!.saveDefaultLoad(snapshot.session.id, currentExercise.id, load)).then((saved) => { if (saved) setDefaultLoadNotice(`${load} kg saved as the default for ${currentExercise.exerciseNameSnapshot}. All remaining working sets were updated.`); }); }}>Use {load ?? '—'} kg as default</Button>
                    </Stack>
                </>}

                {allSetsDone && <StatePanel title="All sets are complete" description="Review the summary, then finish the workout. This action is safe to retry without creating duplicates." icon={<Flag/>}/>}

                <Paper component="section" aria-labelledby="workout-plan-title" sx={{p: 1.5, position: 'relative'}}>
                    <Typography id="workout-plan-title" component="h2" variant="h6" sx={{minHeight: 48, display: 'flex', alignItems: 'center', pr: 6}}>Workout plan · {snapshot.exercises.length} exercises</Typography>
                    <IconButton aria-label={planOpen ? 'Hide workout plan' : 'Show workout plan'} onClick={() => setPlanOpen((open) => !open)} sx={{position: 'absolute', top: 8, right: 8}}><ExpandMore sx={{transform: planOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms'}}/></IconButton>
                    <Collapse in={planOpen}><Stack divider={<Divider flexItem/>} sx={{mt: 1}}>{snapshot.exercises.map((exercise) => {
                        const exerciseSets = snapshot.sets.filter((entry) => entry.sessionExerciseId === exercise.id);
                        const completedSets = exerciseSets.filter((entry) => entry.status === 'completed').length;
                        const isCurrent = exercise.id === currentExercise?.id && !allSetsDone;
                        const canSwitch = !isCurrent && completedSets < exerciseSets.length;
                        return <Stack key={exercise.id} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} gap={1} sx={{py: 1}}><Box minWidth={0}><Typography fontWeight={700}>{exercise.exerciseNameSnapshot}</Typography><Typography variant="body2" color="text.secondary">{exercise.prescriptionSnapshot}</Typography></Box><Stack direction="row" gap={1} alignItems="center" justifyContent="space-between"><Chip size="small" color={isCurrent ? 'primary' : exercise.status === 'completed' ? 'success' : 'default'} label={isCurrent ? 'Current' : `${completedSets}/${exerciseSets.length} sets`}/>{canSwitch && <Button size="small" variant="outlined" startIcon={<SwapHoriz/>} disabled={busy} onClick={() => switchToExercise(exercise)}>Switch here</Button>}</Stack></Stack>;
                    })}</Stack></Collapse>
                </Paper>

                <Paper component="section" sx={{p: 1.5}}>
                    <Typography component="h2" variant="h6">Session controls</Typography>
                    <Stack spacing={1.5} sx={{mt: 1.5}}>
                        <TextField select fullWidth label="Rest for this session" value={snapshot.session.restOverrideSeconds ?? 'exercise-defaults'} disabled={busy} onChange={(event) => void perform(() => service!.setRestOverride(snapshot.session.id, event.target.value === 'exercise-defaults' ? undefined : Number(event.target.value)))} helperText="Applies to the next rest timer.">
                            <MenuItem value="exercise-defaults">Exercise defaults</MenuItem>
                            {[30, 45, 60, 90, 120, 150, 180, 240, 300].map((seconds) => <MenuItem key={seconds} value={seconds}>{seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)}${seconds % 60 ? ':30' : ':00'} min`}</MenuItem>)}
                        </TextField>
                        <Stack direction={{xs: 'column', sm: 'row'}} gap={1}><SecondaryButton startIcon={<Undo/>} disabled={!latestCompleted || busy} onClick={() => latestCompleted && void perform(() => service!.undoSet(snapshot.session.id, latestCompleted.id))}>Undo last set</SecondaryButton><Button color="error" variant="outlined" startIcon={<Flag/>} onClick={() => setFinishOpen(true)}>Finish workout</Button></Stack>
                    </Stack>
                </Paper>
            </Stack>
        </Box>

        {!allSetsDone && currentSet && <WorkoutActionBar>{snapshot.timer ? <Stack spacing={1.25}><RestAction
            remaining={formatTimer(restSeconds)}
            paused={snapshot.timer.status === 'paused'}
            busy={busy}
            onAdjust={(seconds) => { if (service) void service.adjustTimer(snapshot.session.id, seconds).then(setSnapshot); }}
            onTogglePause={() => { if (!service) return; void (snapshot.timer?.status === 'paused' ? service.resumeTimer(snapshot.session.id) : service.pauseTimer(snapshot.session.id)).then(setSnapshot); }}
            onSkip={() => { if (service) void service.skipTimer(snapshot.session.id).then(setSnapshot); }}
        /><CompleteSetAction
            busy={busy}
            disabled={snapshot.session.status === 'paused' || load === undefined || !validReps}
            canGoPrevious={canSwitchExercise}
            canGoNext={canSwitchExercise}
            onPrevious={() => switchNeighborExercise(-1)}
            onComplete={completeCurrentSet}
            onNext={() => switchNeighborExercise(1)}
        /></Stack> : <CompleteSetAction
            busy={busy}
            disabled={snapshot.session.status === 'paused' || load === undefined || !validReps}
            canGoPrevious={canSwitchExercise}
            canGoNext={canSwitchExercise}
            onPrevious={() => switchNeighborExercise(-1)}
            onComplete={completeCurrentSet}
            onNext={() => switchNeighborExercise(1)}
        />}</WorkoutActionBar>}

        <Dialog open={finishOpen} onClose={() => setFinishOpen(false)}><DialogTitle>Finish workout?</DialogTitle><DialogContent><Typography>Remaining sets will stay incomplete in this summary.</Typography></DialogContent><DialogActions><Button onClick={() => setFinishOpen(false)}>Continue</Button><Button variant="contained" color="error" startIcon={<Flag/>} onClick={() => void perform(async () => { const result = await service!.finish(snapshot.session.id); navigate(`/workout/summary/${snapshot.session.id}`); return result; })}>Finish</Button></DialogActions></Dialog>
    </Layout>;
}
