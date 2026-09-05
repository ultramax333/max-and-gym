import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardActionArea, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography} from '@mui/material';
import {Add, AutoAwesome, ArrowForwardRounded, Bolt, BookmarkAdded, CalendarMonth, FitnessCenter, PlayArrow, StopCircle, Timeline} from '@mui/icons-material';
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
    return <Card sx={{height: '100%', ...(featured ? {borderColor: 'rgba(200,243,107,.3)', background: '#1C2217'} : {})}}>
        <CardActionArea onClick={onClick} disabled={!onClick || disabled} sx={{height: '100%', minHeight: featured ? 164 : 100}}>
            <CardContent><Stack direction="row" gap={2} alignItems="center">
                <Box sx={{width: 48, height: 48, borderRadius: '16px', display: 'grid', placeItems: 'center', flexShrink: 0, color: 'primary.main', bgcolor: 'rgba(200,243,107,.09)'}}>{icon}</Box>
                <Box sx={{minWidth: 0, flex: 1}}>
                    {featured && <Typography variant="overline" color="primary.main">NEXT UP</Typography>}
                    <Typography component="h2" variant={featured ? 'h5' : 'h6'}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>{text}</Typography>
                </Box>
                {onClick && <ArrowForwardRounded sx={{fontSize: 20, color: 'text.secondary', flexShrink: 0}}/>}
            </Stack></CardContent>
        </CardActionArea>
    </Card>;
}

function GenerateHero({onClick}: {onClick: () => void}) {
    return <Card sx={{position: 'relative', overflow: 'hidden', bgcolor: '#191E15', borderColor: 'rgba(200,243,107,.2)'}}>
        <Box component="img" src={`${import.meta.env.BASE_URL}media/exercises/alternate-hammer-curl-1.jpg`} alt="" aria-hidden sx={{position: 'absolute', right: 0, top: 0, width: {xs: '50%', sm: '40%'}, height: '100%', objectFit: 'cover', opacity: .3, filter: 'grayscale(1)'}}/>
        <Box aria-hidden sx={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #191E15 34%, rgba(25,30,21,.45) 100%)'}}/>
        <CardContent sx={{position: 'relative', p: {xs: 3, sm: 4}, '&:last-child': {pb: {xs: 3, sm: 4}}}}>
            <Typography variant="overline" color="primary.main">YOUR SESSION. YOUR WAY.</Typography>
            <Typography component="h2" sx={{fontSize: {xs: 32, sm: 42}, fontWeight: 850, letterSpacing: '-.04em', lineHeight: 1.1, my: 1.5, maxWidth: 330}}>Make time<br/>for yourself.</Typography>
            <Typography color="text.secondary" sx={{maxWidth: 260, mb: 3}}>Choose your focus, set your time.<br/>We’ll build the session.</Typography>
            <PrimaryButton startIcon={<AutoAwesome/>} endIcon={<ArrowForwardRounded/>} onClick={onClick}>Generate a session</PrimaryButton>
            <Typography variant="caption" sx={{display: 'block', mt: 2, color: 'text.secondary'}}>15–60 MIN <Box component="span" sx={{mx: 1}}>·</Box> YOUR EQUIPMENT</Typography>
        </CardContent>
    </Card>;
}

function useActiveProgram() { return useLiveQuery(() => programs.active(), [], null); }
function useActiveWorkout() { return useLiveQuery(() => workout.findActive(), [], null); }

async function startNextProgramDay(navigate: ReturnType<typeof useNavigate>, replaceSessionId?: string): Promise<void> {
    const program = await programs.active();
    const day = program?.days[program.currentDayIndex % program.days.length];
    if (!program || !day?.exercises.length) throw new Error('The next program day has no exercises.');
    navigate('/workout/setup', {state: {workoutInput: programDayWorkoutInput(program.name, day, program.trainingContext), replaceSessionId}});
}

async function startQuickWorkout(definition: QuickWorkoutDefinition, navigate: ReturnType<typeof useNavigate>, replaceSessionId?: string): Promise<void> {
    navigate('/workout/setup', {state: {workoutInput: {name: definition.name, plannedDurationSeconds: definition.durationMinutes * 60, exercises: definition.exercises}, replaceSessionId}});
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
            await startNextProgramDay(navigate, replaceCurrent ? activeWorkout?.session.id : undefined);
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

    return <Layout title="max&gym" hideBack><ScreenContainer><SectionHeader eyebrow="TRAIN WITH INTENT" title="Ready to train"/><Stack spacing={2}>
        {error && <Alert severity="error" action={error.includes('no exercises') ? <Button onClick={() => navigate('/programs')}>Open Programs</Button> : undefined}>{error}</Alert>}
        {activeWorkout ? <Card sx={{borderColor: 'rgba(200,243,107,.32)', background: 'radial-gradient(circle at 100% 0%, rgba(200,243,107,.16), transparent 45%), #15181B'}}>
            <CardContent><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}><Box><Typography variant="overline" color="primary.main">WORKOUT IN PROGRESS</Typography><Typography component="h2" variant="h5">{activeWorkout.session.nameSnapshot}</Typography><Typography color="text.secondary">{activeWorkout.sets.filter((entry) => entry.status === 'completed').length}/{activeWorkout.sets.length} sets completed. Resume exactly where you stopped.</Typography></Box><Chip color={activeWorkout.session.status === 'paused' ? 'warning' : 'success'} label={activeWorkout.session.status === 'paused' ? 'Paused' : 'Active'}/></Stack></CardContent>
            <CardActions sx={{px: 2, pb: 2, gap: 1, flexWrap: 'wrap'}}><PrimaryButton startIcon={<PlayArrow/>} onClick={() => navigate('/workout/active')} disabled={busy}>Resume workout</PrimaryButton><Button color="error" variant="outlined" startIcon={<StopCircle/>} onClick={() => setStopOpen(true)} disabled={busy}>Stop workout</Button></CardActions>
        </Card> : active && next
            ? <ShellCard featured title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · ${next.targetDurationMinutes}-minute target. Choose your equipment order before starting.`} icon={<PlayArrow/>} onClick={() => void startProgram()} disabled={busy}/>
            : <GenerateHero onClick={() => navigate('/programs/generate')}/>
        }
        {activeWorkout && active && next && <><Typography variant="overline" color="text.secondary">NEXT PLANNED</Typography><ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercises · stop or replace the active workout before starting this session.`} icon={<CalendarMonth/>} onClick={() => void startProgram()} disabled={busy}/></>}
        {(active || activeWorkout) && <GenerateHero onClick={() => navigate('/programs/generate')}/>}
        <Typography variant="overline" color="text.secondary" sx={{mt: 0.5}}>YOUR TRAINING</Typography>
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 1.5}}>
            <ShellCard title="Saved sessions" text="Your favourites, ready to go." icon={<BookmarkAdded/>} onClick={() => navigate('/programs?view=sessions')}/>
            <ShellCard title="Core video classes" text="Follow along for 10–30 minutes." icon={<Bolt/>} onClick={() => navigate('/train/core-videos')}/>
        </Box>
        {!active && !activeWorkout && (
            <Box sx={{py: 1}}><Typography variant="body2" color="text.secondary">No workout planned</Typography><Button startIcon={<Add/>} onClick={() => navigate('/programs')}>Create a program</Button></Box>
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
            await startQuickWorkout(ARM_WORKOUT_45, navigate, workoutToReplace.id);
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
        <GenerateHero onClick={() => navigate('/programs/generate')}/>
        <Typography variant="overline" color="text.secondary">READY-MADE & SAVED</Typography>
        <ShellCard title={ARM_WORKOUT_45.name} text={ARM_WORKOUT_45.summary} icon={<FitnessCenter/>} onClick={() => void chooseArmWorkout()}/>
        <ShellCard title="Saved sessions" text="Restart or edit the single sessions you chose to keep." icon={<BookmarkAdded/>} onClick={() => navigate('/programs?view=sessions')}/>
        <ShellCard title="Essential workout" text="Start or resume a reliable local workout." icon={<FitnessCenter/>} onClick={() => navigate('/workout/active')}/>
        <ShellCard title="Previous workouts" text="Open the editor and your existing RepQuest workouts." icon={<FitnessCenter/>} onClick={() => navigate('/workouts')}/>
        {!active && <ShellCard title="Create a planned workout" text="Activate a program with two or three days." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <ShellCard title="Core video classes" text="Choose a professional 10 to 30-minute class or add your own video." icon={<Bolt/>} onClick={() => navigate('/train/core-videos')}/>
    </Stack></ScreenContainer><Dialog open={Boolean(workoutToReplace)} onClose={() => !replacing && setWorkoutToReplace(undefined)}><DialogTitle>Start {ARM_WORKOUT_45.name}?</DialogTitle><DialogContent><Typography>Your workout “{workoutToReplace?.name}” is still active. Replace it with the complete 5-exercise arm workout? Completed sets stay saved on this device.</Typography></DialogContent><DialogActions><Button onClick={() => setWorkoutToReplace(undefined)} disabled={replacing}>Keep current workout</Button><Button variant="contained" onClick={() => void replaceWithArmWorkout()} disabled={replacing}>Start arm workout</Button></DialogActions></Dialog></Layout>;
}

export function ProgressShellPage() {
    return <Layout title="Progress" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESS" title="A clear view of your consistency"/><StatePanel title="No trend yet" description="After your first workouts, find frequency, duration and personal bests here." icon={<Timeline/>}/></ScreenContainer></Layout>;
}
