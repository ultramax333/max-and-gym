import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, IconButton, LinearProgress, Stack, Typography} from '@mui/material';
import {ArrowDownward, ArrowUpward, PlayArrow} from '@mui/icons-material';
import {useLocation, useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {EquipmentBadge, EquipmentBadges} from '../../components/ui/EquipmentBadge';
import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {db} from '../../db/db';
import {recordDiagnostic} from '../../diagnostics/service';
import {StartWorkoutInput} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';
import {availableStations, EquipmentStation, EQUIPMENT_STATIONS, orderByEquipment} from '../../workout/equipmentStations';

const catalog = new ExerciseCatalogRepository(db);

export function WorkoutSetupPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const service = useWorkoutService();
    const routeState = location.state as {workoutInput?: StartWorkoutInput; replaceSessionId?: string} | null;
    const input = routeState?.workoutInput;
    const [prepared, setPrepared] = useState<StartWorkoutInput>();
    const [order, setOrder] = useState<EquipmentStation[]>([]);
    const [keepOriginal, setKeepOriginal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const starting = useRef(false);
    // Reuse the operation ID if the UI retries an ambiguous successful write.
    const operationId = useRef(crypto.randomUUID());

    useEffect(() => {
        let mounted = true;
        if (!input?.exercises?.length) return;
        void catalog.list().then((library) => {
            if (!mounted) return;
            const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
            const exercises = input.exercises.map((exercise) => ({...exercise, equipmentTags: exercise.equipmentTags?.length ? exercise.equipmentTags : byId.get(exercise.exerciseId)?.equipmentTags}));
            setPrepared({...input, exercises});
            setOrder(availableStations(exercises));
        }).catch(() => {
            if (mounted) setError('Equipment could not be loaded. Go back and try again. [WORKOUT_EQUIPMENT_LOAD_FAILED]');
            void recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code: 'WORKOUT_EQUIPMENT_LOAD_FAILED', safeMessage: 'Workout equipment preparation failed.'});
        });
        return () => { mounted = false; };
    }, [input]);

    const exercises = useMemo(() => !prepared ? [] : keepOriginal ? prepared.exercises : orderByEquipment(prepared.exercises, order), [prepared, order, keepOriginal]);
    const move = (index: number, delta: number) => {
        setKeepOriginal(false);
        setOrder((previous) => {
            const next = [...previous];
            [next[index], next[index + delta]] = [next[index + delta], next[index]];
            return next;
        });
    };
    const start = async () => {
        if (!prepared || !service || starting.current) return;
        starting.current = true;
        setBusy(true);
        setError('');
        try {
            if (routeState?.replaceSessionId) {
                const current = await service.findActive();
                if (current?.session.creationOperationId === operationId.current) {
                    navigate('/workout/active', {replace: true});
                    return;
                }
                if (current && current.session.id !== routeState.replaceSessionId) throw new Error('Active workout changed.');
                if (current) await service.abandon(current.session.id);
            }
            await service.startProgramDay({...prepared, exercises}, operationId.current);
            navigate('/workout/active', {replace: true});
        } catch {
            void recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code: 'WORKOUT_START_FAILED', safeMessage: 'Prepared workout could not be started.'});
            setError('Could not start this session. Resume or finish any current workout, then retry. [WORKOUT_START_FAILED]');
        } finally {
            starting.current = false;
            setBusy(false);
        }
    };

    return <Layout title="Session setup" hideNav><ScreenContainer>
        <SectionHeader eyebrow="BEFORE YOU START" title="Equipment order"/>
        {!input?.exercises?.length ? <StatePanel title="Choose a workout first" description="Open a generated session or saved program to arrange its equipment." action={<Button onClick={() => navigate('/train')}>Choose workout</Button>}/> : <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {!prepared && !error && <LinearProgress aria-label="Loading workout equipment"/>}
            {prepared && <>
                <Typography variant="h6">{prepared.name}</Typography>
                {routeState?.replaceSessionId && <Alert severity="warning">Starting will stop the previous workout. Completed sets stay saved. Going back keeps it active.</Alert>}
                <Typography color="text.secondary">Bench free now? Move it first. Exercises needing several items follow the first matching station. All required equipment stays listed.</Typography>
                <Stack spacing={1} component="section" aria-label="Equipment priority">
                    {order.map((station, index) => <Card key={station} variant="outlined" sx={{borderLeft: `4px solid ${EQUIPMENT_STATIONS[station].color}`}}><Stack direction="row" alignItems="center" gap={1} sx={{p: 1}}>
                        <Typography sx={{width: 20, flexShrink: 0}}>{index + 1}</Typography><Box flex={1}><EquipmentBadge station={station}/></Box>
                        <IconButton aria-label={`Move ${EQUIPMENT_STATIONS[station].label} earlier`} disabled={busy || index === 0} onClick={() => move(index, -1)} sx={{width: 48, height: 48}}><ArrowUpward/></IconButton>
                        <IconButton aria-label={`Move ${EQUIPMENT_STATIONS[station].label} later`} disabled={busy || index === order.length - 1} onClick={() => move(index, 1)} sx={{width: 48, height: 48}}><ArrowDownward/></IconButton>
                    </Stack></Card>)}
                </Stack>
                <Button variant="outlined" disabled={busy} onClick={() => setKeepOriginal((value) => !value)}>{keepOriginal ? 'Use equipment order' : 'Keep original exercise order'}</Button>
                <Typography variant="body2" color="text.secondary">{keepOriginal ? 'Original order selected. ' : ''}This session only. Your saved program, sets, loads, repetitions and rest stay unchanged. Supersets stay together. The time target does not change.</Typography>
                {prepared.exercises.some((exercise) => exercise.locked) && <Alert severity="info">This plan contains priority lifts. Put their equipment first if you want to perform them before accessories.</Alert>}
                <Typography component="h2" variant="h6">Exercise order · {exercises.length} exercises</Typography>
                <Stack component="ol" spacing={1} sx={{listStyle: 'none', p: 0, m: 0}} aria-label="Ordered exercises">
                    {exercises.map((exercise, index) => <Card component="li" key={`${exercise.exerciseId}-${index}`}><CardContent><Stack spacing={1}>
                        <Typography fontWeight={700}>{index + 1}. {exercise.exerciseName}</Typography>
                        <EquipmentBadges exercise={exercise}/>
                        <Typography variant="body2" color="text.secondary">{exercise.prescriptionSnapshot}{exercise.groupId ? ` · ${exercise.groupType ?? 'Grouped'}` : ''}</Typography>
                    </Stack></CardContent></Card>)}
                </Stack>
                <PrimaryButton startIcon={<PlayArrow/>} disabled={busy || !service} onClick={() => void start()}>{busy ? 'Starting…' : 'Start workout'}</PrimaryButton>
            </>}
        </Stack>}
    </ScreenContainer></Layout>;
}
