import React, {useEffect, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, CardMedia, Checkbox, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';
import {AutoAwesome, Block, ExpandMore, Favorite, FavoriteBorder, FitnessCenter, KeyboardArrowDown, KeyboardArrowUp, PlayArrow, Save, Schedule, Search, Tune} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {ExerciseContextRatingRepository} from '../../exerciseCatalog/ExerciseContextRatingRepository';
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
import {QuickSessionGenerationStateRepository} from '../../generator/QuickSessionGenerationStateRepository';
import {hasAvailableEquipment} from '../../generator/constraints';
import {ExerciseLoadRecommendation, recommendExerciseLoad} from '../../workout/loadRecommendation';
import {EquipmentBadges} from '../../components/ui/EquipmentBadge';

const catalog = new ExerciseCatalogRepository(db);
const programs = new ProgramRepository(db);
const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));
const quickSessionState = new QuickSessionGenerationStateRepository(db);
const contextRatings = new ExerciseContextRatingRepository(db);
const allEquipment = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'];
type SelectableGoal = Exclude<GoalBlend, 'balanced'>;
const goalRecovery: Record<SelectableGoal, number> = {strength: 180, hypertrophy: 90, endurance: 60};

function formatLoadRange(recommendation: ExerciseLoadRecommendation): string {
    if (recommendation.loadMinKg === undefined || recommendation.loadMaxKg === undefined) return 'Load calibration needed';
    return recommendation.loadMinKg === recommendation.loadMaxKg
        ? `${recommendation.loadMinKg} kg suggested`
        : `${recommendation.loadMinKg}–${recommendation.loadMaxKg} kg suggested`;
}

async function loadAdviceForProgram(program: GeneratedProgram): Promise<Record<string, ExerciseLoadRecommendation>> {
    const entries = await Promise.all(program.days.flatMap((day) => day.exercises).map(async (exercise) => {
        const history = await workout.exerciseHistoryList(exercise.exerciseId, undefined, 3);
        return [exercise.exerciseId, recommendExerciseLoad({
            repsMin: exercise.prescription.repsMin,
            repsMax: exercise.prescription.repsMax,
            targetRir: exercise.prescription.targetRir,
            history,
        })] as const;
    }));
    return Object.fromEntries(entries);
}

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
    const [goal, setGoal] = useState<SelectableGoal>('hypertrophy');
    const [sessionRestSeconds, setSessionRestSeconds] = useState(90);
    const [equipment, setEquipment] = useState(allEquipment);
    const [seed, setSeed] = useState('maxgym-session-01');
    const [variationNumber, setVariationNumber] = useState(1);
    const [preview, setPreview] = useState<GeneratedProgram>();
    const [loadAdvice, setLoadAdvice] = useState<Record<string, ExerciseLoadRecommendation>>({});
    const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
    const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
    const [replacementSearch, setReplacementSearch] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    useEffect(() => {
        let active = true;
        void quickSessionState.get(zone).then((state) => { if (active) setVariationNumber(state.nextVariation); });
        return () => { active = false; };
    }, [zone]);

    const generate = async () => {
        setBusy(true);
        setError('');
        try {
            const catalogExercises = await catalog.list({status: 'eligible'});
            setLibraryExercises(catalogExercises);
            const candidates = catalogExercises as GeneratorCandidate[];
            const generationState = await quickSessionState.get(zone);
            const ratings = await contextRatings.list({zone, goal});
            const variation = generationState.nextVariation;
            const recentExerciseIds = [...new Set(generationState.recentGenerations.flat())];
            const input: GeneratorInput = {
                frequency: 1,
                durationMinutes: duration,
                goal,
                equipment,
                priorityMuscles: [],
                variation: 'moderate',
                blockedExerciseIds: [],
                blockedTags: [],
                favouriteExerciseIds: [],
                neverSuggestExerciseIds: [],
                recentExerciseIds,
                contextualExerciseRatings: ratings.map((entry) => ({exerciseId: entry.exerciseId, rating: entry.rating})),
                stableExercises: [],
                coreMinutes: 10,
                lowBackComfortWarmup: true,
                sessionRestSeconds,
                seed: `${seed}:variation-${variation}`,
                generatorVersion: BUILD_GENERATOR_VERSION,
                exerciseSeedVersion: EXERCISE_SEED_VERSION,
                programSeedVersion: PROGRAM_SEED_VERSION,
            };
            const result = generateQuickSession(input, candidates, zone);
            if (!result.ok) {
                setPreview(undefined);
                setLoadAdvice({});
                setError(result.message);
            } else {
                setPreview(result.program);
                setLoadAdvice(await loadAdviceForProgram(result.program));
                setReplaceIndex(null);
                const nextState = await quickSessionState.record(zone, variation, result.program.days[0].exercises.map((exercise) => exercise.exerciseId));
                setVariationNumber(nextState.nextVariation);
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
            navigate('/workout/setup', {state: {workoutInput: generatedSessionWorkoutInput(preview)}});
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

    const replaceExercise = async (index: number, replacement: LibraryExercise) => {
        if (!preview) return;
        const currentDay = preview.days[0];
        const existingIds = new Set(currentDay.exercises.map((entry) => entry.exerciseId));
        if (existingIds.has(replacement.id)) return;
        if (!matchesQuickSessionZone(replacement, zone) || !hasAvailableEquipment(replacement, equipment)) {
            setError(`This exercise does not match ${QUICK_SESSION_ZONES.find((entry) => entry.value === zone)?.label.toLowerCase() ?? 'the selected area'} training with the available equipment.`);
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
            equipmentTags: [...replacement.equipmentTags],
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
        const history = await workout.exerciseHistoryList(replacement.id, undefined, 3);
        setLoadAdvice((advice) => ({...advice, [replacement.id]: recommendExerciseLoad({
            repsMin: nextExercise.prescription.repsMin,
            repsMax: nextExercise.prescription.repsMax,
            targetRir: nextExercise.prescription.targetRir,
            history,
        })}));
        setReplaceIndex(null);
    };

    const toggleFavourite = async (exercise: LibraryExercise) => {
        const favourite = !exercise.favourite;
        await catalog.updatePreference(exercise.id, {favourite});
        setLibraryExercises((current) => current
            .map((entry) => entry.id === exercise.id ? {...entry, favourite} : entry)
            .sort((a, b) => Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name)));
    };

    const movePreviewExercise = (index: number, direction: -1 | 1) => {
        if (!preview) return;
        const targetIndex = index + direction;
        const exercises = [...preview.days[0].exercises];
        if (targetIndex < 0 || targetIndex >= exercises.length) return;
        [exercises[index], exercises[targetIndex]] = [exercises[targetIndex], exercises[index]];
        const nextProgram = {...preview, days: [{...preview.days[0], exercises}], identityHash: ''};
        nextProgram.identityHash = stableHash(JSON.stringify(nextProgram));
        setPreview(nextProgram);
    };

    const markNeverSuggest = async (exercise: LibraryExercise) => {
        await catalog.updatePreference(exercise.id, {neverSuggest: true});
        setLibraryExercises((current) => current.filter((entry) => entry.id !== exercise.id));
        if (preview?.days[0].exercises.some((entry) => entry.exerciseId === exercise.id)) await generate();
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
        <Paper sx={{overflow: 'hidden', borderRadius: '24px', bgcolor: '#15181B'}}>
            <Box sx={{p: {xs: 2, sm: 3}, borderBottom: '1px solid', borderColor: 'divider'}}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                    <Box><Typography variant="overline" color="primary.main" fontWeight={850}>QUICK SESSION</Typography><Typography variant="h5" component="h2">Build a single session</Typography><Typography color="text.secondary" sx={{mt: 0.5, maxWidth: 620}}>A session built around your time and equipment. Recovery is included.</Typography></Box>
                    <Box sx={{width: 52, height: 52, borderRadius: '18px', display: {xs: 'none', sm: 'grid'}, placeItems: 'center', bgcolor: 'rgba(200,243,107,.12)', color: 'primary.main'}}><FitnessCenter/></Box>
                </Stack>
                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 3}}>
                    <FormControl fullWidth sx={{gridColumn: '1 / -1'}}><InputLabel id="quick-zone">Body area</InputLabel><Select labelId="quick-zone" label="Body area" value={zone} onChange={(event) => { setZone(event.target.value as QuickSessionZone); setPreview(undefined); }}>{QUICK_SESSION_ZONES.map((entry) => <MenuItem key={entry.value} value={entry.value}>{entry.label}</MenuItem>)}</Select></FormControl>
                    <FormControl fullWidth sx={{gridColumn: '1 / -1'}}><InputLabel id="quick-goal">Training goal</InputLabel><Select labelId="quick-goal" label="Training goal" value={goal} onChange={(event) => { const next = event.target.value as SelectableGoal; setGoal(next); setSessionRestSeconds(goalRecovery[next]); setPreview(undefined); }}><MenuItem value="strength">Strength</MenuItem><MenuItem value="hypertrophy">Hypertrophy</MenuItem><MenuItem value="endurance">Endurance</MenuItem></Select></FormControl>
                    <FormControl fullWidth><InputLabel id="quick-duration">Duration</InputLabel><Select labelId="quick-duration" label="Duration" value={duration} onChange={(event) => { setDuration(Number(event.target.value) as ProgramDurationMinutes); setPreview(undefined); }}>{QUICK_SESSION_DURATIONS.map((minutes) => <MenuItem key={minutes} value={minutes}>{minutes} minutes</MenuItem>)}</Select></FormControl>
                    <FormControl fullWidth><InputLabel id="quick-rest">Recovery between sets</InputLabel><Select labelId="quick-rest" label="Recovery between sets" value={sessionRestSeconds} onChange={(event) => { setSessionRestSeconds(Number(event.target.value)); setPreview(undefined); }}>{[30, 45, 60, 90, 120, 150, 180, 240, 300].map((seconds) => <MenuItem key={seconds} value={seconds}>{seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)}${seconds % 60 ? ':30' : ':00'} min`}</MenuItem>)}</Select></FormControl>
                </Box>
            </Box>
            <Divider/>
            <Box sx={{px: {xs: 2, sm: 3}, py: 1}}>
                <Button fullWidth color="inherit" startIcon={<Tune/>} endIcon={<ExpandMore sx={{transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms'}}/>} onClick={() => setAdvancedOpen((open) => !open)} sx={{justifyContent: 'space-between'}}>Equipment and variation</Button>
                <Collapse in={advancedOpen}><Stack spacing={1.5} sx={{py: 1.5}}><TextField label="Variation seed" value={seed} onChange={(event) => setSeed(event.target.value)} helperText={`Next generation: variation ${variationNumber}. Every click creates another reproducible variation.`}/><Typography variant="subtitle2">Equipment available</Typography><Stack direction="row" gap={0.25} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => { setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item)); setPreview(undefined); }}/>} label={item}/>)}</Stack></Stack></Collapse>
            </Box>
            <Box sx={{p: {xs: 2, sm: 3}, pt: 1}}><PrimaryButton fullWidth size="large" startIcon={<AutoAwesome/>} disabled={busy || equipment.length === 0} onClick={() => void generate()}>{busy ? 'Working…' : preview ? 'Generate another variation' : 'Generate session'}</PrimaryButton></Box>
        </Paper>
        {error && <Alert severity="error">{error}</Alert>}
        {preview && <Stack spacing={1.5}>
            <Paper sx={{p: {xs: 2, sm: 2.5}, borderRadius: '20px', bgcolor: 'rgba(200,243,107,.06)', borderColor: 'rgba(200,243,107,.28)'}}>
                <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'center'}} gap={2}><Box><Typography variant="overline" color="primary.main" fontWeight={850}>SESSION READY</Typography><Typography variant="h5" component="h2">{preview.name}</Typography><Stack direction="row" gap={0.75} flexWrap="wrap" sx={{mt: 1}}><Chip size="small" label={`${preview.days[0].exercises.length} exercises`}/><Chip size="small" label={`${preview.days[0].exercises.reduce((sum, exercise) => sum + exercise.prescription.workingSets, 0)} working sets`}/><Chip size="small" icon={<Schedule/>} label={`about ${Math.round(preview.days[0].duration.total / 60)} min`}/></Stack><Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>Rest included; warm-up excluded.</Typography></Box><Stack direction={{xs: 'row', sm: 'column'}} gap={1}><PrimaryButton fullWidth startIcon={<PlayArrow/>} disabled={busy} onClick={() => void start()}>Start this session</PrimaryButton><Button fullWidth variant="outlined" startIcon={<Save/>} disabled={busy} onClick={() => void save()}>Save to My sessions</Button></Stack></Stack>
            </Paper>
            <Paper component="section" aria-labelledby="session-time-plan" sx={{p: 2, borderRadius: '20px'}}>
                <Typography id="session-time-plan" component="h3" variant="h6">Session time plan</Typography>
                <Typography variant="body2" color="text.secondary">The estimate uses the working sets and recovery selected above. Reordering does not change the total.</Typography>
                <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{mt: 1.5}}>
                    <Chip size="small" label={`Work ${Math.round(preview.days[0].duration.execution / 60)} min`}/>
                    <Chip size="small" label={`Rest ${Math.round(preview.days[0].duration.rest / 60)} min`}/>
                    <Chip size="small" label={`Setup and moving ${Math.round((preview.days[0].duration.setup + preview.days[0].duration.transitions) / 60)} min`}/>
                    <Chip size="small" color="primary" label={`Estimated ${Math.round(preview.days[0].duration.total / 60)} / ${preview.days[0].targetDurationMinutes} min`}/>
                </Stack>
            </Paper>
            {preview.days[0].exercises.map((exercise, index) => {
                const details = libraryExercises.find((entry) => entry.id === exercise.exerciseId);
                const startImage = details?.media.find((media) => media.kind === 'start-image') ?? details?.media.find((media) => media.kind === 'thumbnail');
                const endImage = details?.media.find((media) => media.kind === 'end-image');
                return <Card key={`${exercise.exerciseId}-${index}`} variant="outlined" sx={{overflow: 'hidden', borderRadius: '20px', bgcolor: '#15181B'}}><Stack direction={{xs: 'column', sm: 'row'}}>
                    <Box sx={{width: {xs: '100%', sm: 220}, height: {xs: 205, sm: 220}, flexShrink: 0, display: 'grid', gridTemplateColumns: endImage ? '1fr 1fr' : '1fr', gap: '1px', bgcolor: 'divider'}}>{startImage && <CardMedia component="img" image={catalogMediaUrl(startImage.path)} alt={startImage.altText} loading="lazy" sx={{width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'background.default'}}/>}{endImage && <CardMedia component="img" image={catalogMediaUrl(endImage.path)} alt={endImage.altText} loading="lazy" sx={{width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'background.default'}}/>}{!startImage && <Box sx={{height: '100%', bgcolor: 'background.default', display: 'grid', placeItems: 'center'}}><Typography variant="caption" color="text.secondary">No local photo</Typography></Box>}</Box>
                    <CardContent sx={{minWidth: 0, flex: 1, p: 2}}><Stack spacing={1}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Box><Typography variant="overline" color="primary.main">EXERCISE {index + 1}</Typography><Typography component="h3" variant="h6">{exercise.exerciseName}</Typography><EquipmentBadges exercise={exercise}/></Box>{details && <Stack direction="row"><IconButton aria-label={details.favourite ? `Remove ${details.name} from favourites` : `Add ${details.name} to favourites`} onClick={() => void toggleFavourite(details)}>{details.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</IconButton><IconButton color="warning" aria-label={`Never suggest ${details.name}`} disabled={busy} onClick={() => void markNeverSuggest(details)}><Block/></IconButton></Stack>}</Stack><Stack direction="row" gap={0.75} flexWrap="wrap"><Chip size="small" label={`${exercise.prescription.workingSets} × ${exercise.prescription.repsMin}–${exercise.prescription.repsMax}`}/><Chip size="small" variant="outlined" label={`RIR ${exercise.prescription.targetRir}`}/><Chip size="small" variant="outlined" label={`${exercise.prescription.restSeconds} s rest`}/></Stack>{loadAdvice[exercise.exerciseId] && <Box sx={{p: 1.25, borderRadius: '12px', bgcolor: 'rgba(126,161,248,.08)'}}><Stack direction="row" gap={0.75} alignItems="center" flexWrap="wrap"><Typography variant="body2" fontWeight={750}>{formatLoadRange(loadAdvice[exercise.exerciseId])}</Typography>{loadAdvice[exercise.exerciseId].status === 'recommended' && <Chip size="small" color="secondary" variant="outlined" label={`${loadAdvice[exercise.exerciseId].confidence} confidence`}/>}</Stack><Typography variant="caption" color="text.secondary">{loadAdvice[exercise.exerciseId].reason} Saved manual defaults still take priority.</Typography></Box>}<Typography variant="body2" color="text.secondary">{exercise.reasons.join(' ')}</Typography><Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap"><Button variant="outlined" disabled={libraryExercises.length === 0} onClick={() => { setReplacementSearch(''); setReplaceIndex(index); }}>Replace exercise</Button><IconButton aria-label={`Move ${exercise.exerciseName} earlier`} disabled={index === 0} onClick={() => movePreviewExercise(index, -1)}><KeyboardArrowUp/></IconButton><IconButton aria-label={`Move ${exercise.exerciseName} later`} disabled={index === preview.days[0].exercises.length - 1} onClick={() => movePreviewExercise(index, 1)}><KeyboardArrowDown/></IconButton></Stack></Stack></CardContent>
                </Stack></Card>;
            })}
            <Alert severity="info">Save it to My sessions to find it later from Train or Programs, then rename, reorder or edit it at any time.</Alert>
        </Stack>}
        {preview && <Dialog open={replaceIndex !== null} onClose={() => setReplaceIndex(null)} fullWidth maxWidth="md"><DialogTitle>Replace exercise</DialogTitle><DialogContent dividers><Typography color="text.secondary" sx={{mb: 2}}>Choose an exercise whose reviewed training focus matches the selected body area. Sets, reps and rest are kept. Blocked exercises stay excluded from future sessions.</Typography><TextField fullWidth label="Search alternatives" value={replacementSearch} onChange={(event) => setReplacementSearch(event.target.value)} InputProps={{startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>}} sx={{mb: 1}}/><Typography variant="caption" color="text.secondary" sx={{display: 'block', mb: 2}}>{visibleReplacementOptions.length} compatible exercise{visibleReplacementOptions.length === 1 ? '' : 's'}</Typography>{visibleReplacementOptions.length ? <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))'}, gap: 1.5}}>{visibleReplacementOptions.map((option) => { const image = option.media.find((media) => media.kind === 'thumbnail') ?? option.media.find((media) => media.kind === 'start-image'); return <Card key={option.id} variant="outlined"><Stack direction="row" gap={1}>{image && <CardMedia component="img" image={catalogMediaUrl(image.path)} alt={image.altText} loading="lazy" sx={{width: 96, height: 96, objectFit: 'cover'}}/>}<CardContent sx={{minWidth: 0, flex: 1}}><Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography fontWeight={700}>{option.name}</Typography><Stack direction="row"><Button size="small" aria-label={option.favourite ? `Remove ${option.name} from favourites` : `Add ${option.name} to favourites`} onClick={() => void toggleFavourite(option)}>{option.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</Button><Button size="small" color="warning" aria-label={`Never suggest ${option.name}`} onClick={() => void markNeverSuggest(option)}><Block/></Button></Stack></Stack><Typography variant="body2" color="text.secondary">{option.primaryMuscles.join(', ')}</Typography><EquipmentBadges exercise={{exerciseId: option.id, equipmentTags: option.equipmentTags}}/><Button size="small" sx={{mt: 1}} onClick={() => replaceExercise(replaceIndex ?? 0, option)}>Use this exercise</Button></CardContent></Stack></Card>; })}</Box> : <Alert severity="info">No compatible unused alternative matches this search.</Alert>}</DialogContent><DialogActions><Button onClick={() => setReplaceIndex(null)}>Cancel</Button></DialogActions></Dialog>}
    </Stack>;
}

function WeeklyProgramBuilder() {
    const navigate = useNavigate();
    const [frequency, setFrequency] = useState<2 | 3>(RELEASE_DEFAULTS.frequency);
    const [duration, setDuration] = useState<40 | 60>(RELEASE_DEFAULTS.durationMinutes);
    const [goal, setGoal] = useState<SelectableGoal>(RELEASE_DEFAULTS.goal);
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
    return <Stack spacing={2}><Card><CardContent><Stack spacing={2}><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><FormControl fullWidth><InputLabel id="generator-frequency">Frequency</InputLabel><Select labelId="generator-frequency" label="Frequency" value={frequency} onChange={(event) => setFrequency(Number(event.target.value) as 2 | 3)}><MenuItem value={2}>2 days</MenuItem><MenuItem value={3}>3 days</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-duration">Duration</InputLabel><Select labelId="generator-duration" label="Duration" value={duration} onChange={(event) => setDuration(Number(event.target.value) as 40 | 60)}><MenuItem value={40}>40 minutes</MenuItem><MenuItem value={60}>60 minutes</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-goal">Goal</InputLabel><Select labelId="generator-goal" label="Goal" value={goal} onChange={(event) => setGoal(event.target.value as SelectableGoal)}><MenuItem value="strength">Strength</MenuItem><MenuItem value="hypertrophy">Hypertrophy</MenuItem><MenuItem value="endurance">Endurance</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-core">Core</InputLabel><Select labelId="generator-core" label="Core" value={coreMinutes} onChange={(event) => setCoreMinutes(Number(event.target.value) as 10 | 15)}><MenuItem value={10}>10 minutes</MenuItem><MenuItem value={15}>15 minutes</MenuItem></Select></FormControl></Stack><TextField label="Reproducible seed" value={seed} onChange={(event) => setSeed(event.target.value)} helperText={`Version ${BUILD_GENERATOR_VERSION} · seed and inputs preserved`}/><Stack direction="row" gap={1} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}/>} label={item}/>)}</Stack><FormControlLabel control={<Checkbox checked={lowBackComfort} onChange={(event) => setLowBackComfort(event.target.checked)}/>} label="Include the lower-back comfort sequence"/><PrimaryButton startIcon={<AutoAwesome/>} onClick={() => void generate()}>Generate</PrimaryButton></Stack></CardContent></Card>{error && <Alert severity="error">{error}</Alert>}{preview && <><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">Preview · {preview.identityHash}</Typography><PrimaryButton startIcon={<Save/>} onClick={() => void save()}>Save as draft</PrimaryButton></Stack>{preview.days.map((day) => <Card key={day.name}><CardContent><Stack spacing={1}><Typography variant="h5" component="h2">{day.name}</Typography><Typography color="text.secondary">{day.emphasis} · {Math.round(day.duration.total / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Warm-up ${Math.round(day.duration.warmup / 60)} min`}/><Chip label={`Ramp sets ${Math.round(day.duration.ramp / 60)} min`}/><Chip label={`Rest ${Math.round(day.duration.rest / 60)} min`}/><Chip label={`Conditioning ${Math.round(day.duration.conditioning / 60)} min`}/></Stack>{day.exercises.map((exercise) => <Stack key={exercise.exerciseId} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1} sx={{py: 1, borderTop: 1, borderColor: 'divider'}}><div><Typography fontWeight={700}>{exercise.exerciseName}</Typography><Typography variant="body2" color="text.secondary">{exercise.role} · {exercise.prescription.workingSets} × {exercise.prescription.repsMin}–{exercise.prescription.repsMax} · rest {exercise.prescription.restSeconds} s</Typography></div><Typography variant="body2" sx={{maxWidth: 430}}>{exercise.reasons.join(' ')}</Typography></Stack>)}</Stack></CardContent></Card>)}{core && <Card><CardContent><Typography variant="h5" component="h2">Core {core.targetMinutes}</Typography><Typography color="text.secondary">{core.rounds} rounds · grouped positions : {core.positionCluster} · {Math.round(core.estimatedSeconds / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 1}}>{core.exercises.map((exercise) => <Chip key={exercise.exerciseId} label={exercise.name}/>)}</Stack></CardContent></Card>}<Alert severity="info">Normalized inputs, {preview.explanation.selections.length} selections and {preview.explanation.exclusions.length} explainable exclusions. No progression is applied automatically.</Alert></>}</Stack>;
}

export function GeneratorPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'session' | 'program'>('session');
    return <Layout title="Generator" hideNav><ScreenContainer><SectionHeader eyebrow="SESSION BUILDER" title="Workout generator"/><Typography color="text.secondary" sx={{mt: -1, mb: 2}}>Build a coherent session for today or a reusable weekly plan.</Typography><Paper sx={{p: 0.5, mb: 2, borderRadius: '16px'}}><ToggleButtonGroup exclusive value={mode} onChange={(_, next: 'session' | 'program' | null) => { if (next) setMode(next); }} fullWidth sx={{'& .MuiToggleButton-root': {border: 0, borderRadius: '12px !important', minHeight: 48}}}><ToggleButton value="session">Single session</ToggleButton><ToggleButton value="program">Weekly program</ToggleButton></ToggleButtonGroup></Paper>{mode === 'session' ? <QuickSessionBuilder/> : <WeeklyProgramBuilder/>}<Button sx={{mt: 2}} onClick={() => navigate('/programs')}>Back to programs</Button></ScreenContainer></Layout>;
}
