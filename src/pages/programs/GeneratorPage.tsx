import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import {AutoAwesome, Save} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {GENERATOR_VERSION as BUILD_GENERATOR_VERSION, EXERCISE_SEED_VERSION, PROGRAM_SEED_VERSION} from '../../config/buildIdentity';
import {generateCoreSession} from '../../generator/coreWarmup';
import {generateProgram, regenerateAccessories} from '../../generator/deterministicGenerator';
import {GeneratedCoreSession, GeneratedProgram, GeneratorCandidate, GeneratorInput, GoalBlend} from '../../generator/types';
import {generateQuickSession, QUICK_SESSION_DURATIONS, QUICK_SESSION_ZONES, QuickSessionZone} from '../../generator/quickSession';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {generatedSessionWorkoutInput} from '../../programs/workoutSnapshot';
import {DexieWorkoutRepository} from '../../workout/DexieWorkoutRepository';
import {WorkoutApplicationService} from '../../workout/WorkoutApplicationService';
import {ProgramDurationMinutes} from '../../programs/types';
import {ProgramDetailPage, ProgramListPage} from './ProgramPages';
import {RELEASE_DEFAULTS} from '../../config/releaseDefaults';

const catalog = new ExerciseCatalogRepository(db);
const programs = new ProgramRepository(db);
const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));
const allEquipment = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'];

export function ProgramsWithGeneratorPage() {
    const navigate = useNavigate();
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}><Button variant="contained" startIcon={<AutoAwesome/>} onClick={() => navigate('/programs/generate')}>Generate</Button></Box><ProgramListPage/></>;
}

export function ProgramDetailWithGeneratorActions() {
    const {programId = ''} = useParams();
    const program = useLiveQuery(() => programs.get(programId), [programId]);
    const [message, setMessage] = useState('');
    const regenerate = async () => {
        if (!program?.generatorInputSnapshot || !program.generatorProgramSnapshot) return;
        const {inputHash: _inputHash, ...input} = JSON.parse(program.generatorInputSnapshot) as GeneratorInput & {inputHash?: string};
        void _inputHash;
        const previous = JSON.parse(program.generatorProgramSnapshot) as GeneratedProgram;
        const candidates = await catalog.list({status: 'eligible'}) as GeneratorCandidate[];
        const result = regenerateAccessories(previous, input, candidates);
        if (!result.ok) { setMessage(result.message); return; }
        await programs.applyRegeneratedAccessories(program.id, result.program);
        setMessage('Accessories regenerated; locked exercises are unchanged.');
    };
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}>{program?.source === 'generator' && program.weeklyFrequency > 1 && <Button variant="contained" startIcon={<AutoAwesome/>} onClick={() => void regenerate()}>Regenerate accessories</Button>}</Box>{message && <Alert severity="info" sx={{position: 'fixed', zIndex: 1400, bottom: {xs: 144, md: 80}, right: {xs: 16, md: 32}}}>{message}</Alert>}<ProgramDetailPage/></>;
}

function QuickSessionBuilder() {
    const navigate = useNavigate();
    const [zone, setZone] = useState<QuickSessionZone>('arms');
    const [duration, setDuration] = useState<ProgramDurationMinutes>(45);
    const [equipment, setEquipment] = useState(allEquipment);
    const [seed, setSeed] = useState('maxgym-session-01');
    const [preview, setPreview] = useState<GeneratedProgram>();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const generate = async () => {
        setBusy(true);
        setError('');
        try {
            const candidates = await catalog.list({status: 'eligible'}) as GeneratorCandidate[];
            const input: GeneratorInput = {
                frequency: 1,
                durationMinutes: duration,
                goal: 'hypertrophy',
                equipment,
                priorityMuscles: [],
                variation: 'moderate',
                blockedExerciseIds: [],
                blockedTags: [],
                favouriteExerciseIds: [],
                neverSuggestExerciseIds: [],
                stableExercises: [],
                coreMinutes: 10,
                lowBackComfortWarmup: true,
                seed,
                generatorVersion: BUILD_GENERATOR_VERSION,
                exerciseSeedVersion: EXERCISE_SEED_VERSION,
                programSeedVersion: PROGRAM_SEED_VERSION,
            };
            const result = generateQuickSession(input, candidates, zone);
            if (!result.ok) {
                setPreview(undefined);
                setError(result.message);
            } else {
                setPreview(result.program);
            }
        } catch (reason) {
            setPreview(undefined);
            setError(reason instanceof Error ? reason.message : 'Could not generate the session.');
        } finally {
            setBusy(false);
        }
    };

    const start = async () => {
        if (!preview) return;
        setBusy(true);
        try {
            await workout.startProgramDay(generatedSessionWorkoutInput(preview));
            navigate('/workout/active');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not start the session.');
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!preview) return;
        setBusy(true);
        try {
            const created = await programs.createGenerated(preview);
            navigate(`/programs/${created.id}`);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not save the session.');
            setBusy(false);
        }
    };

    return <Stack spacing={2}>
        <Card><CardContent><Stack spacing={2}>
            <Typography variant="h5" component="h2">Build a single session</Typography>
            <Typography color="text.secondary">Choose a body area and a time budget. The session is generated locally from your exercise catalog.</Typography>
            <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
                <FormControl fullWidth><InputLabel id="quick-zone">Body area</InputLabel><Select labelId="quick-zone" label="Body area" value={zone} onChange={(event) => setZone(event.target.value as QuickSessionZone)}>{QUICK_SESSION_ZONES.map((entry) => <MenuItem key={entry.value} value={entry.value}>{entry.label}</MenuItem>)}</Select></FormControl>
                <FormControl fullWidth><InputLabel id="quick-duration">Duration</InputLabel><Select labelId="quick-duration" label="Duration" value={duration} onChange={(event) => setDuration(Number(event.target.value) as ProgramDurationMinutes)}>{QUICK_SESSION_DURATIONS.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}</Select></FormControl>
            </Stack>
            <TextField label="Reproducible seed" value={seed} onChange={(event) => setSeed(event.target.value)} helperText={`Version ${BUILD_GENERATOR_VERSION} · same inputs produce the same session`}/>
            <Typography variant="subtitle2">Equipment available</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}/>} label={item}/>)}</Stack>
            <PrimaryButton startIcon={<AutoAwesome/>} disabled={busy || equipment.length === 0} onClick={() => void generate()}>{busy ? 'Working…' : 'Generate session'}</PrimaryButton>
        </Stack></CardContent></Card>
        {error && <Alert severity="error">{error}</Alert>}
        {preview && <Card><CardContent><Stack spacing={2}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} gap={1}><div><Typography variant="h5" component="h2">{preview.name}</Typography><Typography color="text.secondary">{preview.days[0].exercises.length} exercises · about {Math.round(preview.days[0].duration.total / 60)} min</Typography></div><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><Button variant="outlined" startIcon={<Save/>} disabled={busy} onClick={() => void save()}>Save and edit</Button><PrimaryButton disabled={busy} onClick={() => void start()}>Start this session</PrimaryButton></Stack></Stack>
            {preview.days[0].exercises.map((exercise, index) => <Stack key={exercise.exerciseId} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1} sx={{py: 1, borderTop: 1, borderColor: 'divider'}}><div><Typography fontWeight={700}>{index + 1}. {exercise.exerciseName}</Typography><Typography variant="body2" color="text.secondary">{exercise.prescription.workingSets} × {exercise.prescription.repsMin}–{exercise.prescription.repsMax} · rest {exercise.prescription.restSeconds} s</Typography></div><Typography variant="body2" color="text.secondary">{exercise.reasons.join(' ')}</Typography></Stack>)}
            <Alert severity="info">You can start it now, or save it to Programs to rename, reorder and edit exercises later.</Alert>
        </Stack></CardContent></Card>}
    </Stack>;
}

function WeeklyProgramBuilder() {
    const navigate = useNavigate();
    const [frequency, setFrequency] = useState<2 | 3>(RELEASE_DEFAULTS.frequency);
    const [duration, setDuration] = useState<40 | 60>(RELEASE_DEFAULTS.durationMinutes);
    const [goal, setGoal] = useState<GoalBlend>(RELEASE_DEFAULTS.goal);
    const [coreMinutes, setCoreMinutes] = useState<10 | 15>(RELEASE_DEFAULTS.coreMinutes);
    const [lowBackComfort, setLowBackComfort] = useState(true);
    const [equipment, setEquipment] = useState(allEquipment);
    const [seed, setSeed] = useState('maxgym-01');
    const [preview, setPreview] = useState<GeneratedProgram>();
    const [core, setCore] = useState<GeneratedCoreSession>();
    const [error, setError] = useState('');
    const makeInput = (): GeneratorInput => ({frequency, durationMinutes: duration, goal, equipment, priorityMuscles: [], variation: 'moderate', blockedExerciseIds: [], blockedTags: [], favouriteExerciseIds: [], neverSuggestExerciseIds: [], stableExercises: [], coreMinutes, lowBackComfortWarmup: lowBackComfort, seed, generatorVersion: BUILD_GENERATOR_VERSION, exerciseSeedVersion: EXERCISE_SEED_VERSION, programSeedVersion: PROGRAM_SEED_VERSION});
    const generate = async () => {
        setError('');
        const candidates = await catalog.list({status: 'eligible'}) as GeneratorCandidate[];
        const generatorInput = makeInput();
        const result = generateProgram(generatorInput, candidates);
        if (!result.ok) { setPreview(undefined); setError(`${result.message} ${result.exclusions.length} explained exclusion(s).`); return; }
        setPreview(result.program);
        setCore(generateCoreSession(generatorInput, candidates));
    };
    const save = async () => { if (!preview) return; const created = await programs.createGenerated(preview); navigate(`/programs/${created.id}`); };
    return <Stack spacing={2}><Card><CardContent><Stack spacing={2}><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><FormControl fullWidth><InputLabel id="generator-frequency">Frequency</InputLabel><Select labelId="generator-frequency" label="Frequency" value={frequency} onChange={(event) => setFrequency(Number(event.target.value) as 2 | 3)}><MenuItem value={2}>2 days</MenuItem><MenuItem value={3}>3 days</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-duration">Duration</InputLabel><Select labelId="generator-duration" label="Duration" value={duration} onChange={(event) => setDuration(Number(event.target.value) as 40 | 60)}><MenuItem value={40}>40 minutes</MenuItem><MenuItem value={60}>60 minutes</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-goal">Goal</InputLabel><Select labelId="generator-goal" label="Goal" value={goal} onChange={(event) => setGoal(event.target.value as GoalBlend)}><MenuItem value="strength">Strength</MenuItem><MenuItem value="balanced">Balanced</MenuItem><MenuItem value="hypertrophy">Hypertrophy</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-core">Core</InputLabel><Select labelId="generator-core" label="Core" value={coreMinutes} onChange={(event) => setCoreMinutes(Number(event.target.value) as 10 | 15)}><MenuItem value={10}>10 minutes</MenuItem><MenuItem value={15}>15 minutes</MenuItem></Select></FormControl></Stack><TextField label="Reproducible seed" value={seed} onChange={(event) => setSeed(event.target.value)} helperText={`Version ${BUILD_GENERATOR_VERSION} · seed and inputs preserved`}/><Stack direction="row" gap={1} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}/>} label={item}/>)}</Stack><FormControlLabel control={<Checkbox checked={lowBackComfort} onChange={(event) => setLowBackComfort(event.target.checked)}/>} label="Include the lower-back comfort sequence"/><PrimaryButton startIcon={<AutoAwesome/>} onClick={() => void generate()}>Generate</PrimaryButton></Stack></CardContent></Card>{error && <Alert severity="error">{error}</Alert>}{preview && <><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">Preview · {preview.identityHash}</Typography><PrimaryButton startIcon={<Save/>} onClick={() => void save()}>Save as draft</PrimaryButton></Stack>{preview.days.map((day) => <Card key={day.name}><CardContent><Stack spacing={1}><Typography variant="h5" component="h2">{day.name}</Typography><Typography color="text.secondary">{day.emphasis} · {Math.round(day.duration.total / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Warm-up ${Math.round(day.duration.warmup / 60)} min`}/><Chip label={`Ramp sets ${Math.round(day.duration.ramp / 60)} min`}/><Chip label={`Rest ${Math.round(day.duration.rest / 60)} min`}/><Chip label={`Conditioning ${Math.round(day.duration.conditioning / 60)} min`}/></Stack>{day.exercises.map((exercise) => <Stack key={exercise.exerciseId} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1} sx={{py: 1, borderTop: 1, borderColor: 'divider'}}><div><Typography fontWeight={700}>{exercise.exerciseName}</Typography><Typography variant="body2" color="text.secondary">{exercise.role} · {exercise.prescription.workingSets} × {exercise.prescription.repsMin}–{exercise.prescription.repsMax} · rest {exercise.prescription.restSeconds} s</Typography></div><Typography variant="body2" sx={{maxWidth: 430}}>{exercise.reasons.join(' ')}</Typography></Stack>)}</Stack></CardContent></Card>)}{core && <Card><CardContent><Typography variant="h5" component="h2">Core {core.targetMinutes}</Typography><Typography color="text.secondary">{core.rounds} rounds · grouped positions : {core.positionCluster} · {Math.round(core.estimatedSeconds / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 1}}>{core.exercises.map((exercise) => <Chip key={exercise.exerciseId} label={exercise.name}/>)}</Stack></CardContent></Card>}<Alert severity="info">Normalized inputs, {preview.explanation.selections.length} selections and {preview.explanation.exclusions.length} explainable exclusions. No progression is applied automatically.</Alert></>}</Stack>;
}

export function GeneratorPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'session' | 'program'>('session');
    return <Layout title="Generator" hideNav><ScreenContainer><SectionHeader eyebrow="LOCAL WORKOUT BUILDER" title="Create a session or a weekly program"/><ToggleButtonGroup exclusive value={mode} onChange={(_, next: 'session' | 'program' | null) => { if (next) setMode(next); }} fullWidth sx={{mb: 2}}><ToggleButton value="session">Single session</ToggleButton><ToggleButton value="program">Weekly program</ToggleButton></ToggleButtonGroup>{mode === 'session' ? <QuickSessionBuilder/> : <WeeklyProgramBuilder/>}<Button sx={{mt: 2}} onClick={() => navigate('/programs')}>Back to programs</Button></ScreenContainer></Layout>;
}
