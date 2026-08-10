import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardContent, CardMedia, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import {AutoAwesome, Favorite, FavoriteBorder, Save, Search} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {LibraryExercise} from '../../exerciseCatalog/types';
import {GENERATOR_VERSION as BUILD_GENERATOR_VERSION, EXERCISE_SEED_VERSION, PROGRAM_SEED_VERSION} from '../../config/buildIdentity';
import {generateCoreSession} from '../../generator/coreWarmup';
import {generateProgram, regenerateAccessories, stableHash} from '../../generator/deterministicGenerator';
import {GeneratedCoreSession, GeneratedProgram, GeneratorCandidate, GeneratorInput, GoalBlend} from '../../generator/types';
import {generateQuickSession, matchesQuickSessionZone, quickSessionReplacementCandidates, QUICK_SESSION_DURATIONS, QUICK_SESSION_ZONES, QuickSessionZone} from '../../generator/quickSession';
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

function catalogMediaUrl(path: string): string {
    return `${import.meta.env.BASE_URL}${path}`;
}

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
    const [sessionRestSeconds, setSessionRestSeconds] = useState(90);
    const [equipment, setEquipment] = useState(allEquipment);
    const [seed, setSeed] = useState('maxgym-session-01');
    const [variationNumber, setVariationNumber] = useState(1);
    const [preview, setPreview] = useState<GeneratedProgram>();
    const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
    const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
    const [replacementSearch, setReplacementSearch] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const generate = async () => {
        setBusy(true);
        setError('');
        try {
            const catalogExercises = await catalog.list({status: 'eligible'});
            setLibraryExercises(catalogExercises);
            const candidates = catalogExercises as GeneratorCandidate[];
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
                sessionRestSeconds,
                seed: `${seed}:variation-${variationNumber}`,
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
                setReplaceIndex(null);
                setVariationNumber((current) => current + 1);
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

    const replaceExercise = (index: number, replacement: LibraryExercise) => {
        if (!preview) return;
        const currentDay = preview.days[0];
        const existingIds = new Set(currentDay.exercises.map((entry) => entry.exerciseId));
        if (existingIds.has(replacement.id)) return;
        if (!matchesQuickSessionZone(replacement, zone) || !(replacement.equipmentTags.includes('body only') || replacement.equipmentTags.some((tag) => equipment.includes(tag)))) {
            setError(`This exercise does not primarily target ${QUICK_SESSION_ZONES.find((entry) => entry.value === zone)?.label.toLowerCase() ?? 'the selected area'} with the available equipment.`);
            setReplaceIndex(null);
            return;
        }
        const current = currentDay.exercises[index];
        const replacementBase = {
            ...current,
            exerciseId: replacement.id,
            exerciseName: replacement.name,
            movementPattern: replacement.movementPattern,
            primaryMuscles: [...replacement.primaryMuscles],
            alternativeExerciseIds: [],
            reasons: ['Manually selected from the local exercise alternatives.'],
        };
        const nextSelectedIds = new Set(currentDay.exercises.filter((_, entryIndex) => entryIndex !== index).map((entry) => entry.exerciseId));
        nextSelectedIds.add(replacement.id);
        const nextExercise = {...replacementBase, alternativeExerciseIds: quickSessionReplacementCandidates(libraryExercises, zone, equipment, nextSelectedIds, replacementBase).slice(0, 3).map((entry) => entry.id)};
        const nextDay = {...currentDay, exercises: currentDay.exercises.map((entry, entryIndex) => entryIndex === index ? nextExercise : entry)};
        const nextSelections = preview.explanation.selections.map((selection) => selection.exerciseId === current.exerciseId ? {...selection, exerciseId: replacement.id, reasons: nextExercise.reasons} : selection);
        const nextProgram = {...preview, days: [nextDay], explanation: {...preview.explanation, selections: nextSelections}, identityHash: ''};
        nextProgram.identityHash = stableHash(JSON.stringify(nextProgram));
        setPreview(nextProgram);
        setReplaceIndex(null);
    };

    const toggleFavourite = async (exercise: LibraryExercise) => {
        const favourite = !exercise.favourite;
        await catalog.updatePreference(exercise.id, {favourite});
        setLibraryExercises((current) => current
            .map((entry) => entry.id === exercise.id ? {...entry, favourite} : entry)
            .sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name)));
    };

    const replacementOptions = replaceIndex === null || !preview ? [] : (() => {
        const current = preview.days[0].exercises[replaceIndex];
        const selectedIds = new Set(preview.days[0].exercises.map((entry) => entry.exerciseId));
        return quickSessionReplacementCandidates(libraryExercises, zone, equipment, selectedIds, current, 40);
    })();
    const normalizedReplacementSearch = replacementSearch.trim().toLowerCase();
    const visibleReplacementOptions = normalizedReplacementSearch
        ? replacementOptions.filter((entry) => [entry.name, ...entry.primaryMuscles, ...entry.equipmentTags].join(' ').toLowerCase().includes(normalizedReplacementSearch))
        : replacementOptions;

    return <Stack spacing={2}>
        <Card><CardContent><Stack spacing={2}>
            <Typography variant="h5" component="h2">Build a single session</Typography>
            <Typography color="text.secondary">Choose a body area and a training-time target. The session is generated locally; rest counts toward the target, while warm-up is left to you.</Typography>
            <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
                <FormControl fullWidth><InputLabel id="quick-zone">Body area</InputLabel><Select labelId="quick-zone" label="Body area" value={zone} onChange={(event) => setZone(event.target.value as QuickSessionZone)}>{QUICK_SESSION_ZONES.map((entry) => <MenuItem key={entry.value} value={entry.value}>{entry.label}</MenuItem>)}</Select></FormControl>
                <FormControl fullWidth><InputLabel id="quick-duration">Duration</InputLabel><Select labelId="quick-duration" label="Duration" value={duration} onChange={(event) => setDuration(Number(event.target.value) as ProgramDurationMinutes)}>{QUICK_SESSION_DURATIONS.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}</Select></FormControl>
            </Stack>
            <FormControl fullWidth><InputLabel id="quick-rest">Recovery between sets</InputLabel><Select labelId="quick-rest" label="Recovery between sets" value={sessionRestSeconds} onChange={(event) => { setSessionRestSeconds(Number(event.target.value)); setPreview(undefined); }}>{[30, 45, 60, 90, 120, 150, 180, 240, 300].map((seconds) => <MenuItem key={seconds} value={seconds}>{seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)}${seconds % 60 ? ':30' : ':00'} min`}</MenuItem>)}</Select></FormControl>
            <Typography variant="caption" color="text.secondary">Recovery is included when calculating how many exercises fit in the selected duration.</Typography>
            <TextField label="Variation seed" value={seed} onChange={(event) => { setSeed(event.target.value); setVariationNumber(1); }} helperText={`Next generation: variation ${variationNumber}. Every click creates another reproducible variation.`}/>
            <Typography variant="subtitle2">Equipment available</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}/>} label={item}/>)}</Stack>
            <PrimaryButton startIcon={<AutoAwesome/>} disabled={busy || equipment.length === 0} onClick={() => void generate()}>{busy ? 'Working…' : 'Generate session'}</PrimaryButton>
        </Stack></CardContent></Card>
        {error && <Alert severity="error">{error}</Alert>}
        {preview && <Card><CardContent><Stack spacing={2}>
            <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} gap={1}><div><Typography variant="h5" component="h2">{preview.name}</Typography><Typography color="text.secondary">{preview.days[0].exercises.length} exercises · {preview.days[0].exercises.reduce((sum, exercise) => sum + exercise.prescription.workingSets, 0)} working sets · about {Math.round(preview.days[0].duration.total / 60)} min</Typography><Typography variant="caption" color="text.secondary">Rest included; warm-up excluded.</Typography></div><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><Button variant="outlined" startIcon={<Save/>} disabled={busy} onClick={() => void save()}>Save and edit</Button><PrimaryButton disabled={busy} onClick={() => void start()}>Start this session</PrimaryButton></Stack></Stack>
            {preview.days[0].exercises.map((exercise, index) => {
                const details = libraryExercises.find((entry) => entry.id === exercise.exerciseId);
                const startImage = details?.media.find((media) => media.kind === 'start-image') ?? details?.media.find((media) => media.kind === 'thumbnail');
                const endImage = details?.media.find((media) => media.kind === 'end-image');
                return <Card key={`${exercise.exerciseId}-${index}`} variant="outlined"><CardContent><Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
                    <Box sx={{width: {xs: '100%', sm: 190}, flexShrink: 0, display: 'grid', gridTemplateColumns: endImage ? '1fr 1fr' : '1fr', gap: 0.5, alignContent: 'start'}}>{startImage && <CardMedia component="img" image={catalogMediaUrl(startImage.path)} alt={startImage.altText} loading="lazy" sx={{width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 1}}/>}{endImage && <CardMedia component="img" image={catalogMediaUrl(endImage.path)} alt={endImage.altText} loading="lazy" sx={{width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 1}}/>}{!startImage && <Box sx={{aspectRatio: '1', bgcolor: 'background.default', borderRadius: 1, display: 'grid', placeItems: 'center'}}><Typography variant="caption" color="text.secondary">No local photo</Typography></Box>}</Box>
                    <Stack spacing={0.75} sx={{minWidth: 0, flex: 1}}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography fontWeight={700}>{index + 1}. {exercise.exerciseName}</Typography>{details && <Button size="small" aria-label={details.favourite ? `Remove ${details.name} from favourites` : `Add ${details.name} to favourites`} onClick={() => void toggleFavourite(details)}>{details.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</Button>}</Stack><Typography variant="body2" color="text.secondary">{exercise.prescription.workingSets} × {exercise.prescription.repsMin}–{exercise.prescription.repsMax} · rest {exercise.prescription.restSeconds} s</Typography><Typography variant="body2" color="text.secondary">{exercise.reasons.join(' ')}</Typography><Box><Button size="small" variant="outlined" disabled={libraryExercises.length === 0} onClick={() => { setReplacementSearch(''); setReplaceIndex(index); }}>Replace exercise</Button></Box></Stack>
                </Stack></CardContent></Card>;
            })}
            <Alert severity="info">You can start it now, or save it to Programs to rename, reorder and edit exercises later.</Alert>
        </Stack></CardContent></Card>}
        {preview && <Dialog open={replaceIndex !== null} onClose={() => setReplaceIndex(null)} fullWidth maxWidth="md"><DialogTitle>Replace exercise</DialogTitle><DialogContent dividers><Typography color="text.secondary" sx={{mb: 2}}>Choose an exercise whose primary muscles match the selected body area. Sets, reps and rest are kept.</Typography><TextField fullWidth label="Search alternatives" value={replacementSearch} onChange={(event) => setReplacementSearch(event.target.value)} InputProps={{startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>}} sx={{mb: 1}}/><Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 2}}>{visibleReplacementOptions.length} compatible exercise{visibleReplacementOptions.length === 1 ? '' : 's'}</Typography>{visibleReplacementOptions.length ? <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))'}, gap: 1.5}}>{visibleReplacementOptions.map((option) => { const image = option.media.find((media) => media.kind === 'thumbnail') ?? option.media.find((media) => media.kind === 'start-image'); return <Card key={option.id} variant="outlined"><Stack direction="row" gap={1}>{image && <CardMedia component="img" image={catalogMediaUrl(image.path)} alt={image.altText} loading="lazy" sx={{width: 96, height: 96, objectFit: 'cover'}}/>}<CardContent sx={{minWidth: 0, flex: 1}}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography fontWeight={700}>{option.name}</Typography><Button size="small" aria-label={option.favourite ? `Remove ${option.name} from favourites` : `Add ${option.name} to favourites`} onClick={() => void toggleFavourite(option)}>{option.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</Button></Stack><Typography variant="body2" color="text.secondary">{option.primaryMuscles.join(', ')} · {option.equipmentTags.join(', ')}</Typography><Button size="small" sx={{mt: 1}} onClick={() => replaceExercise(replaceIndex ?? 0, option)}>Use this exercise</Button></CardContent></Stack></Card>; })}</Box> : <Alert severity="info">No compatible unused alternative matches this search.</Alert>}</DialogContent><DialogActions><Button onClick={() => setReplaceIndex(null)}>Cancel</Button></DialogActions></Dialog>}
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
