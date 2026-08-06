import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, LinearProgress, Paper, Stack, TextField, Typography} from '@mui/material';
import {Add, FitnessCenter, Flag, Pause, PlayArrow, Remove, SkipNext, Undo} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SecondaryButton, StatePanel} from '../../components/ui/UiPrimitives';
import {recordDiagnostic} from '../../diagnostics/service';
import {ActiveWorkoutSnapshot} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';

function formatTimer(seconds: number): string {
    const safe = Math.max(0, seconds);
    return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

function signalRestComplete(): void {
    if ('vibrate' in navigator) navigator.vibrate([150, 80, 150]);
    try {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 660;
        gain.gain.value = 0.08;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
        oscillator.addEventListener('ended', () => void context.close());
    } catch {
        recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Rest timer audio feedback was unavailable.'});
    }
}

function useRestSeconds(snapshot: ActiveWorkoutSnapshot | undefined): number {
    const [tick, setTick] = useState(Date.now());
    useEffect(() => {
        if (snapshot?.timer?.status !== 'running') return;
        const interval = window.setInterval(() => setTick(Date.now()), 500);
        return () => window.clearInterval(interval);
    }, [snapshot?.timer?.status]);
    if (!snapshot?.timer) return 0;
    if (snapshot.timer.status === 'paused') return snapshot.timer.remainingWhenPausedSeconds ?? 0;
    return Math.max(0, Math.ceil((new Date(snapshot.timer.endsAt).getTime() - tick) / 1000));
}

function WorkoutRestBar({snapshot, onChange}: {snapshot: ActiveWorkoutSnapshot; onChange: (next: ActiveWorkoutSnapshot) => void}) {
    const service = useWorkoutService();
    const remaining = useRestSeconds(snapshot);
    const signalled = useRef(false);
    useEffect(() => {
        if (!service || !snapshot.timer || snapshot.timer.status !== 'running' || remaining > 0 || signalled.current) return;
        signalled.current = true;
        signalRestComplete();
        void service.skipTimer(snapshot.session.id).then(onChange);
    }, [onChange, remaining, service, snapshot]);
    useEffect(() => {
        signalled.current = false;
    }, [snapshot.timer?.id]);
    if (!snapshot.timer) return null;
    const paused = snapshot.timer.status === 'paused';
    return <Paper sx={{position: 'sticky', bottom: 0, zIndex: 10, p: 1.5, borderRadius: 0, borderLeft: 0, borderRight: 0}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack><Typography variant="overline">RÉCUPÉRATION</Typography><Typography variant="h5" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatTimer(remaining)}</Typography></Stack>
            <Stack direction="row" alignItems="center">
                <IconButton aria-label="Retirer 15 secondes" onClick={() => void service?.adjustTimer(snapshot.session.id, -15).then(onChange)}><Remove/></IconButton>
                <IconButton aria-label={paused ? 'Reprendre le repos' : 'Mettre le repos en pause'} onClick={() => void (paused ? service?.resumeTimer(snapshot.session.id) : service?.pauseTimer(snapshot.session.id))?.then(onChange)}>{paused ? <PlayArrow/> : <Pause/>}</IconButton>
                <IconButton aria-label="Ajouter 15 secondes" onClick={() => void service?.adjustTimer(snapshot.session.id, 15).then(onChange)}><Add/></IconButton>
                <Button startIcon={<SkipNext/>} onClick={() => void service?.skipTimer(snapshot.session.id).then(onChange)}>Passer</Button>
            </Stack>
        </Stack>
        <Typography variant="caption" color="text.secondary">Le signal est au mieux : Android peut le bloquer si l’application est fermée.</Typography>
    </Paper>;
}

export function ActiveWorkoutPage() {
    const service = useWorkoutService();
    const navigate = useNavigate();
    const [snapshot, setSnapshot] = useState<ActiveWorkoutSnapshot>();
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const [finishOpen, setFinishOpen] = useState(false);
    const [load, setLoad] = useState(0);
    const [reps, setReps] = useState(0);
    const [rir, setRir] = useState(2);

    const refresh = useCallback(async () => {
        if (!service) return;
        setLoading(true);
        try {
            setSnapshot(await service.recover());
            setError(undefined);
        } catch {
            setError('La reprise automatique a échoué. Ouvre Diagnostics avant de réessayer.');
        } finally {
            setLoading(false);
        }
    }, [service]);

    useEffect(() => { void refresh(); }, [refresh]);
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
        if (!currentSet) return;
        setLoad(currentSet.targetLoadKg);
        setReps(currentSet.targetRepsMin);
        setRir(currentSet.targetRir);
    }, [currentSet]);

    const perform = async (action: () => Promise<ActiveWorkoutSnapshot>) => {
        setBusy(true);
        try {
            setSnapshot(await action());
            setError(undefined);
        } catch {
            setError('L’écriture n’a pas été validée. Rien n’a été perdu ; tu peux réessayer.');
        } finally {
            setBusy(false);
        }
    };

    const start = async () => {
        if (!service) return;
        await perform(() => service.start());
    };

    if (loading) return <Layout title="Séance active" hideNav><LinearProgress aria-label="Chargement de la séance"/></Layout>;
    if (!snapshot) return <Layout title="Séance active" hideNav><ScreenContainer>{error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}<StatePanel title="Aucune séance active" description="Démarre la séance essentielle : deux exercices et six séries, entièrement disponibles hors ligne." icon={<FitnessCenter/>} action={<PrimaryButton startIcon={<PlayArrow/>} onClick={() => void start()} disabled={busy}>Démarrer</PrimaryButton>}/></ScreenContainer></Layout>;

    return <Layout title={snapshot.session.nameSnapshot} hideNav hideBack toolItems={<Chip label={snapshot.session.status === 'paused' ? 'En pause' : 'Active'} color={snapshot.session.status === 'paused' ? 'warning' : 'success'}/>}>
        <ScreenContainer>
            <Stack spacing={2}>
                {error && <Alert severity="error" action={<Button onClick={() => navigate('/diagnostics')}>Diagnostics</Button>}>{error}</Alert>}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary">{completed.length}/{snapshot.sets.length} séries terminées</Typography>
                    <Button startIcon={snapshot.session.status === 'paused' ? <PlayArrow/> : <Pause/>} onClick={() => void perform(() => snapshot.session.status === 'paused' ? service!.resume(snapshot.session.id) : service!.pause(snapshot.session.id))}>{snapshot.session.status === 'paused' ? 'Reprendre' : 'Pause'}</Button>
                </Stack>
                <LinearProgress variant="determinate" value={(completed.length / snapshot.sets.length) * 100} aria-label="Progression de la séance"/>
                {!allSetsDone && currentExercise && currentSet && <>
                    <Card><Box sx={{height: 180, display: 'grid', placeItems: 'center', bgcolor: 'background.default'}}><Stack alignItems="center"><FitnessCenter sx={{fontSize: 56, color: 'primary.main'}}/><Typography color="text.secondary">Média local à venir</Typography></Stack></Box><CardContent><Typography component="h1" variant="h4">{currentExercise.exerciseNameSnapshot}</Typography><Typography color="text.secondary">{currentExercise.prescriptionSnapshot}</Typography></CardContent></Card>
                    <Paper sx={{p: 2}}><Typography component="h2" variant="h6">Performance précédente</Typography><Typography color="text.secondary">Aucun historique pour cette séance locale.</Typography></Paper>
                    <Paper sx={{p: 2}}><Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography component="h2" variant="h6">Série {currentSet.sequenceIndex + 1}</Typography><Chip label={`${currentSet.targetLoadKg} kg · ${currentSet.targetRepsMin}–${currentSet.targetRepsMax} reps`}/></Stack><Divider/>
                        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
                            <TextField fullWidth label="Charge réelle (kg)" type="number" value={load} onChange={(event) => setLoad(Number(event.target.value))} inputProps={{inputMode: 'decimal', min: 0, step: 0.5}}/>
                            <TextField fullWidth label="Répétitions réelles" type="number" value={reps} onChange={(event) => setReps(Number(event.target.value))} inputProps={{inputMode: 'numeric', min: 0, step: 1}}/>
                            <TextField fullWidth label="RIR (optionnel)" type="number" value={rir} onChange={(event) => setRir(Number(event.target.value))} inputProps={{inputMode: 'numeric', min: 0, max: 10, step: 1}}/>
                        </Stack>
                        <PrimaryButton disabled={busy || snapshot.session.status === 'paused' || reps < 0 || load < 0} onClick={() => void perform(() => service!.completeSet({sessionId: snapshot.session.id, setId: currentSet.id, actualLoadKg: load, actualReps: reps, actualRir: rir}))}>Valider la série</PrimaryButton>
                    </Stack></Paper>
                </>}
                {allSetsDone && <StatePanel title="Toutes les séries sont terminées" description="Vérifie le résumé puis termine la séance. Cette action est rejouable sans créer de doublon." icon={<Flag/>}/>}
                <Stack direction={{xs: 'column', sm: 'row'}} gap={1}>
                    <SecondaryButton startIcon={<Undo/>} disabled={!latestCompleted || busy} onClick={() => latestCompleted && void perform(() => service!.undoSet(snapshot.session.id, latestCompleted.id))}>Annuler la dernière série</SecondaryButton>
                    <Button color="error" variant="outlined" startIcon={<Flag/>} onClick={() => setFinishOpen(true)}>Terminer la séance</Button>
                </Stack>
            </Stack>
        </ScreenContainer>
        <WorkoutRestBar snapshot={snapshot} onChange={setSnapshot}/>
        <Dialog open={finishOpen} onClose={() => setFinishOpen(false)}><DialogTitle>Terminer la séance ?</DialogTitle><DialogContent><Typography>Les séries restantes resteront non réalisées dans ce résumé.</Typography></DialogContent><DialogActions><Button onClick={() => setFinishOpen(false)}>Continuer</Button><Button variant="contained" color="error" startIcon={<Flag/>} onClick={() => void perform(async () => { const result = await service!.finish(snapshot.session.id); navigate(`/workout/summary/${snapshot.session.id}`); return result; })}>Terminer</Button></DialogActions></Dialog>
    </Layout>;
}
