import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Checkbox, Chip, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
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
import {ProgramRepository} from '../../programs/ProgramRepository';
import {ProgramDetailPage, ProgramListPage} from './ProgramPages';
import {RELEASE_DEFAULTS} from '../../config/releaseDefaults';

const catalog = new ExerciseCatalogRepository(db);
const programs = new ProgramRepository(db);
const allEquipment = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'];

export function ProgramsWithGeneratorPage() {
    const navigate = useNavigate();
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}><Button variant="contained" startIcon={<AutoAwesome/>} onClick={() => navigate('/programs/generate')}>Générer</Button></Box><ProgramListPage/></>;
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
        setMessage('Accessoires régénérés ; les exercices verrouillés sont inchangés.');
    };
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}>{program?.source === 'generator' && <Button variant="contained" startIcon={<AutoAwesome/>} onClick={() => void regenerate()}>Régénérer accessoires</Button>}</Box>{message && <Alert severity="info" sx={{position: 'fixed', zIndex: 1400, bottom: {xs: 144, md: 80}, right: {xs: 16, md: 32}}}>{message}</Alert>}<ProgramDetailPage/></>;
}

export function GeneratorPage() {
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
        if (!result.ok) { setPreview(undefined); setError(`${result.message} ${result.exclusions.length} exclusion(s) expliquée(s).`); return; }
        setPreview(result.program);
        setCore(generateCoreSession(generatorInput, candidates));
    };
    const save = async () => { if (!preview) return; const created = await programs.createGenerated(preview); navigate(`/programs/${created.id}`); };
    return <Layout title="Générateur" hideNav><ScreenContainer><SectionHeader eyebrow="GÉNÉRATEUR DÉTERMINISTE" title="Construire un programme expliqué"/><Stack spacing={2}><Card><CardContent><Stack spacing={2}><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><FormControl fullWidth><InputLabel id="generator-frequency">Fréquence</InputLabel><Select labelId="generator-frequency" label="Fréquence" value={frequency} onChange={(event) => setFrequency(Number(event.target.value) as 2 | 3)}><MenuItem value={2}>2 jours</MenuItem><MenuItem value={3}>3 jours</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-duration">Durée</InputLabel><Select labelId="generator-duration" label="Durée" value={duration} onChange={(event) => setDuration(Number(event.target.value) as 40 | 60)}><MenuItem value={40}>40 minutes</MenuItem><MenuItem value={60}>60 minutes</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-goal">Objectif</InputLabel><Select labelId="generator-goal" label="Objectif" value={goal} onChange={(event) => setGoal(event.target.value as GoalBlend)}><MenuItem value="strength">Force</MenuItem><MenuItem value="balanced">Équilibré</MenuItem><MenuItem value="hypertrophy">Hypertrophie</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="generator-core">Core</InputLabel><Select labelId="generator-core" label="Core" value={coreMinutes} onChange={(event) => setCoreMinutes(Number(event.target.value) as 10 | 15)}><MenuItem value={10}>10 minutes</MenuItem><MenuItem value={15}>15 minutes</MenuItem></Select></FormControl></Stack><TextField label="Seed reproductible" value={seed} onChange={(event) => setSeed(event.target.value)} helperText={`Version ${BUILD_GENERATOR_VERSION} · seed et entrées conservés`}/><Stack direction="row" gap={1} flexWrap="wrap">{allEquipment.map((item) => <FormControlLabel key={item} control={<Checkbox checked={equipment.includes(item)} onChange={(event) => setEquipment((current) => event.target.checked ? [...current, item] : current.filter((value) => value !== item))}/>} label={item}/>)}</Stack><FormControlLabel control={<Checkbox checked={lowBackComfort} onChange={(event) => setLowBackComfort(event.target.checked)}/>} label="Inclure la séquence de confort lombaire"/><PrimaryButton startIcon={<AutoAwesome/>} onClick={() => void generate()}>Générer</PrimaryButton></Stack></CardContent></Card>{error && <Alert severity="error">{error}</Alert>}{preview && <><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h5">Aperçu · {preview.identityHash}</Typography><PrimaryButton startIcon={<Save/>} onClick={() => void save()}>Enregistrer comme brouillon</PrimaryButton></Stack>{preview.days.map((day) => <Card key={day.name}><CardContent><Stack spacing={1}><Typography variant="h5" component="h2">{day.name}</Typography><Typography color="text.secondary">{day.emphasis} · {Math.round(day.duration.total / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Échauffement ${Math.round(day.duration.warmup / 60)} min`}/><Chip label={`Rampes ${Math.round(day.duration.ramp / 60)} min`}/><Chip label={`Repos ${Math.round(day.duration.rest / 60)} min`}/><Chip label={`Conditionnement ${Math.round(day.duration.conditioning / 60)} min`}/></Stack>{day.exercises.map((exercise) => <Stack key={exercise.exerciseId} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1} sx={{py: 1, borderTop: 1, borderColor: 'divider'}}><div><Typography fontWeight={700}>{exercise.exerciseName}</Typography><Typography variant="body2" color="text.secondary">{exercise.role} · {exercise.prescription.workingSets} × {exercise.prescription.repsMin}–{exercise.prescription.repsMax} · repos {exercise.prescription.restSeconds} s</Typography></div><Typography variant="body2" sx={{maxWidth: 430}}>{exercise.reasons.join(' ')}</Typography></Stack>)}</Stack></CardContent></Card>)}{core && <Card><CardContent><Typography variant="h5" component="h2">Core {core.targetMinutes}</Typography><Typography color="text.secondary">{core.rounds} tours · positions regroupées : {core.positionCluster} · {Math.round(core.estimatedSeconds / 60)} min</Typography><Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 1}}>{core.exercises.map((exercise) => <Chip key={exercise.exerciseId} label={exercise.name}/>)}</Stack></CardContent></Card>}<Alert severity="info">Entrées normalisées, {preview.explanation.selections.length} sélections et {preview.explanation.exclusions.length} exclusions explicables. Aucune progression n’est appliquée automatiquement.</Alert></>}</Stack><Button sx={{mt: 2}} onClick={() => navigate('/programs')}>Retour aux programmes</Button></ScreenContainer></Layout>;
}
