import React, {useState} from 'react';
import {Alert, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography} from '@mui/material';
import {Add, Bolt, CalendarMonth, FitnessCenter, PlayArrow, Timeline} from '@mui/icons-material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate} from 'react-router-dom';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import Layout from '../../components/layout';
import {db} from '../../db/db';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {programDayWorkoutInput} from '../../programs/workoutSnapshot';
import {DexieWorkoutRepository} from '../../workout/DexieWorkoutRepository';
import {WorkoutApplicationService} from '../../workout/WorkoutApplicationService';
import {ARM_WORKOUT_45, QuickWorkoutDefinition} from '../../workout/quickWorkouts';

const programs = new ProgramRepository(db);
const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));

function ShellCard({title, text, icon, onClick}: {title: string; text: string; icon: React.ReactNode; onClick?: () => void}) {
    return <Card><CardActionArea onClick={onClick} disabled={!onClick} sx={{minHeight: 132}}><CardContent><Stack direction="row" gap={2} alignItems="flex-start"><Chip icon={icon as React.ReactElement} label="Ready" color="primary"/><Stack><Typography component="h2" variant="h6">{title}</Typography><Typography color="text.secondary">{text}</Typography></Stack></Stack></CardContent></CardActionArea></Card>;
}

function useActiveProgram() { return useLiveQuery(() => programs.active(), []); }

async function startNextProgramDay(navigate: ReturnType<typeof useNavigate>): Promise<void> {
    const program = await programs.active();
    const day = program?.days[program.currentDayIndex % program.days.length];
    if (!program || !day?.exercises.length) { navigate('/programs'); return; }
    await workout.startProgramDay(programDayWorkoutInput(program.name, day));
    navigate('/workout/active');
}

async function startQuickWorkout(definition: QuickWorkoutDefinition, navigate: ReturnType<typeof useNavigate>): Promise<void> {
    await workout.startProgramDay({name: definition.name, exercises: definition.exercises});
    navigate('/workout/active');
}

export function HomeShellPage() {
    const navigate = useNavigate();
    const active = useActiveProgram();
    const next = active?.days[active.currentDayIndex % active.days.length];
    return <Layout title="Home" hideAppBar hideBack><ScreenContainer><SectionHeader eyebrow="MAX & GYM" title="Ready to train"/><Stack spacing={2}>
        {active && next ? <ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · ${next.targetDurationMinutes}-minute target. Start in one tap.`} icon={<PlayArrow/>} onClick={() => startNextProgramDay(navigate)}/> : <ShellCard title="Build your first program" text="Choose a simple structure to see your next workout here." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><ShellCard title="Essential workout" text="Start or resume the reliable offline flow." icon={<PlayArrow/>} onClick={() => navigate('/workout/active')}/><ShellCard title="Quick core" text="10 to 15 minutes, without abrupt transitions." icon={<Bolt/>} onClick={() => navigate('/train')}/></Stack>
        {!active && (
            <StatePanel title="No workout planned" description="Create a program or start a free workout. Your data stays on this device." action={<PrimaryButton startIcon={<Add/>} onClick={() => navigate('/programs')}>Create a program</PrimaryButton>}/>
        )}
    </Stack></ScreenContainer></Layout>;
}

export function TrainShellPage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string>();
    const [workoutToReplace, setWorkoutToReplace] = useState<{id: string; name: string}>();
    const [replacing, setReplacing] = useState(false);
    const active = useActiveProgram();
    const next = active?.days[active.currentDayIndex % active.days.length];
    const chooseArmWorkout = async () => {
        try {
            const current = await workout.recover();
            if (current?.session.nameSnapshot === ARM_WORKOUT_45.name) { navigate('/workout/active'); return; }
            if (current) { setWorkoutToReplace({id: current.session.id, name: current.session.nameSnapshot}); return; }
            await startQuickWorkout(ARM_WORKOUT_45, navigate);
        } catch {
            setError('The arm workout could not be started. Your existing workout data was not changed.');
        }
    };
    const replaceWithArmWorkout = async () => {
        if (!workoutToReplace) return;
        setReplacing(true);
        try {
            await workout.abandon(workoutToReplace.id);
            await startQuickWorkout(ARM_WORKOUT_45, navigate);
        } catch {
            setError('The arm workout could not be started. Completed sets from the previous workout are still saved.');
            setWorkoutToReplace(undefined);
        } finally {
            setReplacing(false);
        }
    };
    return <Layout title="Training" hideBack><ScreenContainer><SectionHeader eyebrow="TRAINING" title="Choose your workout"/><Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {active && next && <ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · prescription is fixed when you start.`} icon={<CalendarMonth/>} onClick={() => startNextProgramDay(navigate)}/>}
        <ShellCard title={ARM_WORKOUT_45.name} text={ARM_WORKOUT_45.summary} icon={<FitnessCenter/>} onClick={() => void chooseArmWorkout()}/>
        <ShellCard title="Essential workout" text="Start or resume a reliable local workout." icon={<FitnessCenter/>} onClick={() => navigate('/workout/active')}/>
        <ShellCard title="Previous workouts" text="Open the editor and your existing RepQuest workouts." icon={<FitnessCenter/>} onClick={() => navigate('/workouts')}/>
        {!active && <ShellCard title="Create a planned workout" text="Activate a program with two or three days." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <ShellCard title="Warm-up and core" text="Detailed flows arrive with the workout engine." icon={<Bolt/>}/>
    </Stack></ScreenContainer><Dialog open={Boolean(workoutToReplace)} onClose={() => !replacing && setWorkoutToReplace(undefined)}><DialogTitle>Start {ARM_WORKOUT_45.name}?</DialogTitle><DialogContent><Typography>Your workout “{workoutToReplace?.name}” is still active. Replace it with the complete 5-exercise arm workout? Completed sets stay saved on this device.</Typography></DialogContent><DialogActions><Button onClick={() => setWorkoutToReplace(undefined)} disabled={replacing}>Keep current workout</Button><Button variant="contained" onClick={() => void replaceWithArmWorkout()} disabled={replacing}>Start arm workout</Button></DialogActions></Dialog></Layout>;
}

export function ProgressShellPage() {
    return <Layout title="Progress" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESS" title="A clear view of your consistency"/><StatePanel title="No trend yet" description="After your first workouts, find frequency, duration and personal bests here." icon={<Timeline/>}/></ScreenContainer></Layout>;
}
