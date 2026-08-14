import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardActionArea, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography} from '@mui/material';
import {Add, ArrowForwardRounded, Bolt, CalendarMonth, FitnessCenter, PlayArrow, StopCircle, Timeline} from '@mui/icons-material';
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

function ShellCard({title, text, icon, onClick, featured = false, disabled = false}: {title: string; text: string; icon: React.ReactNode; onClick?: () => void; featured?: boolean; disabled?: boolean}) {
    return <Card sx={featured ? {borderColor: 'rgba(83,199,183,.32)', background: 'radial-gradient(circle at 100% 0%, rgba(83,199,183,.16), transparent 45%), #101720'} : undefined}><CardActionArea onClick={onClick} disabled={!onClick || disabled} sx={{minHeight: featured ? 156 : 132}}><CardContent><Stack direction="row" gap={2} alignItems="center"><Box sx={{width: featured ? 60 : 52, height: featured ? 60 : 52, borderRadius: featured ? '20px' : '17px', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'primary.main', bgcolor: 'rgba(83,199,183,.12)', border: '1px solid rgba(83,199,183,.18)', '& svg': {fontSize: featured ? 30 : 26}}}>{icon}</Box><Stack sx={{minWidth: 0, flex: 1}} spacing={0.5}>{featured && <Typography variant="overline" color="primary.main">NEXT UP</Typography>}<Typography component="h2" variant={featured ? 'h5' : 'h6'}>{title}</Typography><Typography color="text.secondary">{text}</Typography></Stack>{onClick && <ArrowForwardRounded sx={{color: 'text.secondary', flexShrink: 0}}/>}</Stack></CardContent></CardActionArea></Card>;
}

function useActiveProgram() { return useLiveQuery(() => programs.active(), [], null); }
function useActiveWorkout() { return useLiveQuery(() => workout.findActive(), [], null); }

async function startNextProgramDay(navigate: ReturnType<typeof useNavigate>): Promise<void> {
    const program = await programs.active();
    const day = program?.days[program.currentDayIndex % program.days.length];
    if (!program || !day?.exercises.length) throw new Error('The next program day has no exercises.');
    await workout.startProgramDay(programDayWorkoutInput(program.name, day));
    navigate('/workout/active');
}

async function startQuickWorkout(definition: QuickWorkoutDefinition, navigate: ReturnType<typeof useNavigate>): Promise<void> {
    await workout.startProgramDay({name: definition.name, plannedDurationSeconds: definition.durationMinutes * 60, exercises: definition.exercises});
    navigate('/workout/active');
}

export function HomeShellPage() {
    const navigate = useNavigate();
    const active = useActiveProgram();
    const activeWorkout = useActiveWorkout();
    const next = active?.days[active.currentDayIndex % active.days.length];
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [stopOpen, setStopOpen] = useState(false);
    const [replaceOpen, setReplaceOpen] = useState(false);

    const startProgram = async (replaceCurrent = false) => {
        if (activeWorkout && !replaceCurrent) { setReplaceOpen(true); return; }
        setBusy(true);
        setError('');
        try {
            if (activeWorkout && replaceCurrent) await workout.abandon(activeWorkout.session.id);
            await startNextProgramDay(navigate);
        } catch (reason) {
            setError(reason instanceof Error && reason.message.includes('no exercises')
                ? 'The next program day has no exercises yet. Open Programs to add at least one exercise.'
                : 'The workout could not be started. Your existing workout data was not changed.');
        } finally {
            setBusy(false);
            setReplaceOpen(false);
        }
    };

    const stopWorkout = async () => {
        if (!activeWorkout) return;
        setBusy(true);
        setError('');
        try {
            await workout.abandon(activeWorkout.session.id);
            setStopOpen(false);
        } catch {
            setError('The workout could not be stopped. Your completed sets are still saved.');
        } finally {
            setBusy(false);
        }
    };

    if (active === null || activeWorkout === null) return <Layout title="Home" hideAppBar hideBack><LinearProgress aria-label="Loading home workout state"/></Layout>;

    return <Layout title="Home" hideAppBar hideBack><ScreenContainer><SectionHeader eyebrow="MAX & GYM · LOCAL TRAINING" title="Ready to train"/><Stack spacing={2}>
        {error && <Alert severity="error" action={error.includes('no exercises') ? <Button onClick={() => navigate('/programs')}>Open Programs</Button> : undefined}>{error}</Alert>}
        {activeWorkout ? <Card sx={{borderColor: 'rgba(83,199,183,.32)', background: 'radial-gradient(circle at 100% 0%, rgba(83,199,183,.16), transparent 45%), #101720'}}>
            <CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}><Box><Typography variant="overline" color="primary.main">WORKOUT IN PROGRESS</Typography><Typography component="h2" variant="h5">{activeWorkout.session.nameSnapshot}</Typography><Typography color="text.secondary">{activeWorkout.sets.filter((entry) => entry.status === 'completed').length}/{activeWorkout.sets.length} sets completed. Resume exactly where you stopped.</Typography></Box><Chip color={activeWorkout.session.status === 'paused' ? 'warning' : 'success'} label={activeWorkout.session.status === 'paused' ? 'Paused' : 'Active'}/></Stack></CardContent>
            <CardActions sx={{px: 2, pb: 2, gap: 1, flexWrap: 'wrap'}}><PrimaryButton startIcon={<PlayArrow/>} onClick={() => navigate('/workout/active')} disabled={busy}>Resume workout</PrimaryButton><Button color="error" variant="outlined" startIcon={<StopCircle/>} onClick={() => setStopOpen(true)} disabled={busy}>Stop workout</Button></CardActions>
        </Card> : active && next
            ? <ShellCard featured title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · ${next.targetDurationMinutes}-minute target. Start in one tap.`} icon={<PlayArrow/>} onClick={() => void startProgram()} disabled={busy}/>
            : <ShellCard featured title="Build your first program" text="Choose a simple structure to see your next workout here." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>
        }
        {activeWorkout && active && next && <><Typography variant="overline" color="text.secondary">NEXT PLANNED</Typography><ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · stop or replace the active workout before starting this session.`} icon={<CalendarMonth/>} onClick={() => void startProgram()} disabled={busy}/></>}
        <Typography variant="overline" color="text.secondary" sx={{mt: 0.5}}>QUICK ACTIONS</Typography>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><ShellCard title="Essential workout" text="Start or resume the reliable offline flow." icon={<PlayArrow/>} onClick={() => navigate('/workout/active')}/><ShellCard title="Core video classes" text="Professional 10 to 30-minute classes and your own YouTube links." icon={<Bolt/>} onClick={() => navigate('/train/core-videos')}/></Stack>
        {!active && !activeWorkout && (
            <StatePanel title="No workout planned" description="Create a program or start a free workout. Your data stays on this device." action={<PrimaryButton startIcon={<Add/>} onClick={() => navigate('/programs')}>Create a program</PrimaryButton>}/>
        )}
    </Stack></ScreenContainer>
    <Dialog open={stopOpen} onClose={() => !busy && setStopOpen(false)}><DialogTitle>Stop this workout?</DialogTitle><DialogContent><Typography>Completed sets stay saved on this device. The unfinished sets will be marked as abandoned.</Typography></DialogContent><DialogActions><Button onClick={() => setStopOpen(false)} disabled={busy}>Keep training</Button><Button color="error" variant="contained" onClick={() => void stopWorkout()} disabled={busy}>Stop workout</Button></DialogActions></Dialog>
    <Dialog open={replaceOpen} onClose={() => !busy && setReplaceOpen(false)}><DialogTitle>Start the planned workout?</DialogTitle><DialogContent><Typography>“{activeWorkout?.session.nameSnapshot}” is still active. Replace it with “{active?.name} · {next?.name}”? Completed sets stay saved.</Typography></DialogContent><DialogActions><Button onClick={() => setReplaceOpen(false)} disabled={busy}>Keep current workout</Button><Button variant="contained" onClick={() => void startProgram(true)} disabled={busy}>Replace and start</Button></DialogActions></Dialog>
    </Layout>;
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
        {active && next && <ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · prescription is fixed when you start.`} icon={<CalendarMonth/>} onClick={() => void startNextProgramDay(navigate).catch(() => setError('The planned workout could not be started. Resume or stop the current workout first.'))}/>}
        <ShellCard featured title={ARM_WORKOUT_45.name} text={ARM_WORKOUT_45.summary} icon={<FitnessCenter/>} onClick={() => void chooseArmWorkout()}/>
        <ShellCard title="Essential workout" text="Start or resume a reliable local workout." icon={<FitnessCenter/>} onClick={() => navigate('/workout/active')}/>
        <ShellCard title="Previous workouts" text="Open the editor and your existing RepQuest workouts." icon={<FitnessCenter/>} onClick={() => navigate('/workouts')}/>
        {!active && <ShellCard title="Create a planned workout" text="Activate a program with two or three days." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <ShellCard title="Core video classes" text="Choose a professional 10 to 30-minute class or add your own video." icon={<Bolt/>} onClick={() => navigate('/train/core-videos')}/>
    </Stack></ScreenContainer><Dialog open={Boolean(workoutToReplace)} onClose={() => !replacing && setWorkoutToReplace(undefined)}><DialogTitle>Start {ARM_WORKOUT_45.name}?</DialogTitle><DialogContent><Typography>Your workout “{workoutToReplace?.name}” is still active. Replace it with the complete 5-exercise arm workout? Completed sets stay saved on this device.</Typography></DialogContent><DialogActions><Button onClick={() => setWorkoutToReplace(undefined)} disabled={replacing}>Keep current workout</Button><Button variant="contained" onClick={() => void replaceWithArmWorkout()} disabled={replacing}>Start arm workout</Button></DialogActions></Dialog></Layout>;
}

export function ProgressShellPage() {
    return <Layout title="Progress" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESS" title="A clear view of your consistency"/><StatePanel title="No trend yet" description="After your first workouts, find frequency, duration and personal bests here." icon={<Timeline/>}/></ScreenContainer></Layout>;
}
