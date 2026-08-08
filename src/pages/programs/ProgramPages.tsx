import React, {useEffect, useMemo, useState} from 'react';
import {Add, Archive, ContentCopy, FitnessCenter, Lock, LockOpen, PlayArrow} from '@mui/icons-material';
import {Alert, Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Tab, Tabs, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ReorderControls, ScreenContainer, SecondaryButton, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ExerciseCatalogRepository} from '../../exerciseCatalog/ExerciseCatalogRepository';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {estimateProgramDay, weeklyBalance} from '../../programs/duration';
import {ExerciseGroupType, ExerciseSetScheme, ProgramDayDetail, ProgramExerciseDetail, ProgramFrequency, ProgramStatus} from '../../programs/types';
import {programDayWorkoutInput} from '../../programs/workoutSnapshot';
import {DexieWorkoutRepository} from '../../workout/DexieWorkoutRepository';
import {WorkoutApplicationService} from '../../workout/WorkoutApplicationService';

const programs = new ProgramRepository(db);
const catalog = new ExerciseCatalogRepository(db);
const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));

function statusLabel(status: ProgramStatus): string { return status === 'active' ? 'Active' : status === 'archived' ? 'Archived' : 'Draft'; }
function minutes(seconds: number): string { return `${Math.round(seconds / 60)} min`; }
function boundedInteger(raw: string, minimum: number, maximum: number): number {
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Math.round(value))) : minimum;
}

function CreateProgramDialog({open, onClose}: {open: boolean; onClose: () => void}) {
    const navigate = useNavigate();
    const [name, setName] = useState('My program');
    const [frequency, setFrequency] = useState<ProgramFrequency>(2);
    const [duration, setDuration] = useState<40 | 60>(40);
    const create = async () => { const result = await programs.create({name, weeklyFrequency: frequency, defaultDurationMinutes: duration}); onClose(); navigate(`/programs/${result.id}`); };
    return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Create a program</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}><TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} autoFocus/><FormControl><InputLabel id="frequency-label">Days per week</InputLabel><Select labelId="frequency-label" label="Days per week" value={frequency} onChange={(event) => setFrequency(Number(event.target.value) as ProgramFrequency)}><MenuItem value={2}>2 days</MenuItem><MenuItem value={3}>3 days</MenuItem></Select></FormControl><FormControl><InputLabel id="duration-label">Target duration</InputLabel><Select labelId="duration-label" label="Target duration" value={duration} onChange={(event) => setDuration(Number(event.target.value) as 40 | 60)}><MenuItem value={40}>40 minutes</MenuItem><MenuItem value={60}>60 minutes</MenuItem></Select></FormControl></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><PrimaryButton onClick={create}>Create</PrimaryButton></DialogActions></Dialog>;
}

export function ProgramListPage() {
    const [status, setStatus] = useState<ProgramStatus>('active');
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    useEffect(() => { void programs.importLegacyPlans(); }, []);
    const items = useLiveQuery(() => programs.list(), []) ?? [];
    const filtered = items.filter((entry) => entry.status === status);
    return <Layout title="Programs" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRAMS" title="Structure your progress" action={<PrimaryButton startIcon={<Add/>} onClick={() => setOpen(true)}>Create</PrimaryButton>}/><Tabs value={status} onChange={(_, value: ProgramStatus) => setStatus(value)} aria-label="Program status" sx={{mb: 2}}><Tab value="active" label="Active"/><Tab value="draft" label="Drafts"/><Tab value="archived" label="Archived"/></Tabs>{filtered.length ? <Stack spacing={2}>{filtered.map((program) => <Card key={program.id}><CardContent><Stack direction="row" justifyContent="space-between" gap={2}><Box><Typography variant="h6" component="h2">{program.name}</Typography><Typography color="text.secondary">{program.weeklyFrequency} days · {program.defaultDurationMinutes} min</Typography></Box><Chip label={statusLabel(program.status)} color={program.status === 'active' ? 'success' : 'default'}/></Stack></CardContent><CardActions><Button onClick={() => navigate(`/programs/${program.id}`)}>Open</Button><Button startIcon={<ContentCopy/>} onClick={() => programs.duplicate(program.id)}>Duplicate</Button>{program.status !== 'active' && program.status !== 'archived' && <Button startIcon={<PlayArrow/>} onClick={() => programs.activate(program.id)}>Activate</Button>}{program.status !== 'archived' && <Button startIcon={<Archive/>} onClick={() => programs.archive(program.id)}>Archive</Button>}</CardActions></Card>)}</Stack> : <StatePanel title={`No ${statusLabel(status).toLowerCase()} program`} description="Create a manual two- or three-day structure, then add your exercises." action={<PrimaryButton onClick={() => setOpen(true)}>Create a program</PrimaryButton>}/>}<CreateProgramDialog open={open} onClose={() => setOpen(false)}/></ScreenContainer></Layout>;
}

function OpenAddExerciseDialog({day, open, onClose}: {day: ProgramDayDetail; open: boolean; onClose: () => void}) {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const options = useLiveQuery(() => catalog.list({search}), [search]) ?? [];
    const add = async () => { const exercise = options.find((entry) => entry.id === selectedId); if (!exercise) return; await programs.addExercise({dayId: day.id, exerciseId: exercise.id, exerciseName: exercise.name, movementPattern: exercise.movementPattern, primaryMuscles: exercise.primaryMuscles, defaultRestSeconds: exercise.defaultRestSeconds, defaultReps: exercise.defaultRepRange}); setSelectedId(''); onClose(); };
    return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>Add to {day.name}</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}><TextField label="Search the local library" value={search} onChange={(event) => setSearch(event.target.value)}/><FormControl><InputLabel id={`exercise-${day.id}`}>Exercise</InputLabel><Select labelId={`exercise-${day.id}`} label="Exercise" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{options.slice(0, 60).map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}</Select></FormControl></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><PrimaryButton disabled={!selectedId} onClick={add}>Add</PrimaryButton></DialogActions></Dialog>;
}

function AddExerciseDialog(props: {day: ProgramDayDetail; open: boolean; onClose: () => void}) {
    return props.open ? <OpenAddExerciseDialog {...props}/> : null;
}

function AlternativePicker({exercise}: {exercise: ProgramExerciseDetail}) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(exercise.alternativeExerciseIds);
    const options = useLiveQuery(() => catalog.list(), []) ?? [];
    return <><Button onClick={() => setOpen(true)}>Alternatives ({exercise.alternativeExerciseIds.length})</Button><Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"><DialogTitle>Alternatives to {exercise.exerciseNameSnapshot}</DialogTitle><DialogContent sx={{pt: '12px !important'}}><FormControl fullWidth><InputLabel id={`alternatives-${exercise.id}`}>Replacement exercises</InputLabel><Select multiple labelId={`alternatives-${exercise.id}`} label="Replacement exercises" value={selected} onChange={(event) => setSelected(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}>{options.filter((entry) => entry.id !== exercise.exerciseId).slice(0, 80).map((entry) => <MenuItem key={entry.id} value={entry.id}>{entry.name}</MenuItem>)}</Select></FormControl><Typography variant="caption" color="text.secondary">Alternatives are suggested and never applied without confirmation.</Typography></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><PrimaryButton onClick={async () => { await programs.updateExercise(exercise.id, {alternativeExerciseIds: selected}); setOpen(false); }}>Save</PrimaryButton></DialogActions></Dialog></>;
}

function ExerciseEditor({exercise, selected, onSelect}: {exercise: ProgramExerciseDetail; selected: boolean; onSelect: (checked: boolean) => void}) {
    const [sets, setSets] = useState(exercise.prescription.workingSets);
    const [min, setMin] = useState(exercise.prescription.repsMin);
    const [max, setMax] = useState(exercise.prescription.repsMax);
    const [rest, setRest] = useState(exercise.prescription.restSeconds);
    const [rir, setRir] = useState(exercise.prescription.targetRir);
    const [setScheme, setSetScheme] = useState<ExerciseSetScheme>(exercise.prescription.setScheme ?? 'straight');
    const [warmupSets, setWarmupSets] = useState(exercise.prescription.warmupSets ?? 0);
    const [dropSets, setDropSets] = useState(exercise.prescription.dropSets ?? 0);
    const save = () => programs.updatePrescription(exercise.prescriptionId, {workingSets: sets, repsMin: min, repsMax: Math.max(min, max), restSeconds: rest, targetRir: rir, setScheme, warmupSets, dropSets});
    return <Card variant="outlined"><CardContent><Stack spacing={1.5}><Stack direction="row" alignItems="center" gap={1}><Checkbox checked={selected} onChange={(event) => onSelect(event.target.checked)} inputProps={{'aria-label': `Select ${exercise.exerciseNameSnapshot}`}}/><Box sx={{flex: 1}}><Typography variant="h6" component="h3">{exercise.exerciseNameSnapshot}</Typography><Stack direction="row" gap={1} flexWrap="wrap"><Chip size="small" label={exercise.role}/>{exercise.groupId && <Chip size="small" color="secondary" label={exercise.groupType}/>}<Chip size="small" label={setScheme}/><Chip size="small" icon={exercise.locked ? <Lock/> : <LockOpen/>} label={exercise.locked ? 'Locked' : 'Variable'}/></Stack></Box><Button aria-label={exercise.locked ? `Unlock ${exercise.exerciseNameSnapshot}` : `Lock ${exercise.exerciseNameSnapshot}`} onClick={() => programs.updateExercise(exercise.id, {locked: !exercise.locked})}>{exercise.locked ? <Lock/> : <LockOpen/>}</Button></Stack><Stack direction={{xs: 'column', sm: 'row'}} gap={1} flexWrap="wrap"><FormControl size="small" sx={{minWidth: 130}}><InputLabel id={`role-${exercise.id}`}>Role</InputLabel><Select labelId={`role-${exercise.id}`} label="Role" value={exercise.role} onChange={(event) => programs.updateExercise(exercise.id, {role: event.target.value as ProgramExerciseDetail['role']})}><MenuItem value="primary">Primary</MenuItem><MenuItem value="secondary">Secondary</MenuItem><MenuItem value="accessory">Accessory</MenuItem><MenuItem value="conditioning">Conditioning</MenuItem></Select></FormControl><FormControl size="small" sx={{minWidth: 150}}><InputLabel id={`scheme-${exercise.id}`}>Set scheme</InputLabel><Select labelId={`scheme-${exercise.id}`} label="Set scheme" value={setScheme} onChange={(event) => { const value = event.target.value as ExerciseSetScheme; setSetScheme(value); if (value === 'drop' && dropSets === 0) setDropSets(1); }}><MenuItem value="straight">Straight sets</MenuItem><MenuItem value="top-backoff">Top + back-off</MenuItem><MenuItem value="ramp">Ramp</MenuItem><MenuItem value="drop">Drop set</MenuItem></Select></FormControl><TextField size="small" type="number" label="Warm-up sets" value={warmupSets} onChange={(e) => setWarmupSets(boundedInteger(e.target.value, 0, 5))} inputProps={{min: 0, max: 5}}/><TextField size="small" type="number" label="Working sets" value={sets} onChange={(e) => setSets(boundedInteger(e.target.value, 1, 10))} inputProps={{min: 1, max: 10}}/><TextField size="small" type="number" label="Drop sets" value={dropSets} onChange={(e) => setDropSets(boundedInteger(e.target.value, 0, 4))} inputProps={{min: 0, max: 4}}/><TextField size="small" type="number" label="Min reps" value={min} onChange={(e) => setMin(boundedInteger(e.target.value, 1, 100))}/><TextField size="small" type="number" label="Max reps" value={max} onChange={(e) => setMax(boundedInteger(e.target.value, 1, 100))}/><TextField size="small" type="number" label="Rest (s)" value={rest} onChange={(e) => setRest(boundedInteger(e.target.value, 0, 900))}/><TextField size="small" type="number" label="RIR" value={rir} onChange={(e) => setRir(boundedInteger(e.target.value, 0, 10))}/><TextField size="small" type="date" label="Stable until" value={exercise.stableUntil?.slice(0, 10) ?? ''} InputLabelProps={{shrink: true}} onChange={(e) => programs.updateExercise(exercise.id, {stableUntil: e.target.value || undefined})}/></Stack><Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between"><ReorderControls onMoveUp={() => programs.moveExercise(exercise.id, -1)} onMoveDown={() => programs.moveExercise(exercise.id, 1)}/><Stack direction="row" flexWrap="wrap"><AlternativePicker exercise={exercise}/><Button onClick={save}>Save</Button><Button color="error" onClick={() => programs.removeExercise(exercise.id)}>Remove</Button></Stack></Stack><Typography variant="caption" color="text.secondary">Progression: {exercise.progressionRule.description} Every proposal requires confirmation.</Typography></Stack></CardContent></Card>;
}

function DayEditor({day}: {day: ProgramDayDetail}) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [name, setName] = useState(day.name);
    const [emphasis, setEmphasis] = useState(day.emphasis);
    const [warmup, setWarmup] = useState(Math.round(day.warmupSeconds / 60));
    const [conditioning, setConditioning] = useState(Math.round(day.conditioningSeconds / 60));
    const estimate = estimateProgramDay(day);
    const group = async (type: ExerciseGroupType) => { await programs.groupExercises(day.id, selected, type); setSelected([]); };
    return <Card><CardContent><Stack spacing={2}><Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1}><Stack direction={{xs: 'column', md: 'row'}} gap={1} flex={1}><TextField label="Day name" value={name} onChange={(event) => setName(event.target.value)}/><TextField label="Emphasis" value={emphasis} onChange={(event) => setEmphasis(event.target.value)}/><TextField type="number" label="Warm-up (min)" value={warmup} onChange={(event) => setWarmup(Number(event.target.value))}/><TextField type="number" label="Conditioning (min)" value={conditioning} onChange={(event) => setConditioning(Number(event.target.value))}/><Button onClick={() => programs.updateDay(day.id, {name, emphasis, warmupSeconds: warmup * 60, conditioningSeconds: conditioning * 60})}>Save day</Button></Stack><PrimaryButton startIcon={<Add/>} onClick={() => setOpen(true)}>Add exercise</PrimaryButton></Stack><Typography variant="h5" component="h2">{day.name} <Typography component="span" color="text.secondary">· {day.emphasis} · {day.targetDurationMinutes}-min target</Typography></Typography><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Estimated ${minutes(estimate.total)}`} color={estimate.delta > 300 ? 'warning' : 'success'}/><Chip label={`Warm-up ${minutes(estimate.warmup)}`}/><Chip label={`Ramp sets ${minutes(estimate.ramp)}`}/><Chip label={`Execution ${minutes(estimate.execution)}`}/><Chip label={`Rest ${minutes(estimate.rest)}`}/><Chip label={`Setup/transitions ${minutes(estimate.setup + estimate.transitions)}`}/><Chip label={`Conditioning ${minutes(estimate.conditioning)}`}/></Stack>{estimate.delta > 300 && <Alert severity="warning">The estimate exceeds the target by {minutes(estimate.delta)}. Primary rest periods will not be shortened silently.</Alert>}{selected.length > 0 && <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center"><Typography>{selected.length} selected</Typography><Button onClick={() => group('single')}>Ungroup</Button><Button disabled={selected.length !== 2} onClick={() => group('superset')}>Superset</Button><Button disabled={selected.length !== 3} onClick={() => group('triset')}>Triset</Button><Button disabled={selected.length < 2} onClick={() => group('circuit')}>Circuit</Button></Stack>}<Stack spacing={1.5}>{day.exercises.map((exercise) => <ExerciseEditor key={exercise.id} exercise={exercise} selected={selected.includes(exercise.id)} onSelect={(checked) => setSelected((current) => checked ? [...current, exercise.id] : current.filter((id) => id !== exercise.id))}/>)}</Stack>{!day.exercises.length && <StatePanel title="Empty day" description="Add at least one exercise before activating the program."/>}</Stack></CardContent><AddExerciseDialog day={day} open={open} onClose={() => setOpen(false)}/></Card>;
}

export function ProgramDetailPage() {
    const {programId = ''} = useParams();
    const navigate = useNavigate();
    const program = useLiveQuery(() => programs.get(programId), [programId]);
    const [error, setError] = useState('');
    const balance = useMemo(() => program ? weeklyBalance(program.days) : undefined, [program]);
    if (program === undefined) return <Layout title="Program" hideNav><ScreenContainer><Typography>Loading…</Typography></ScreenContainer></Layout>;
    if (!program) return <Layout title="Program" hideNav><ScreenContainer><StatePanel title="Program not found" description="It may have been archived or deleted." action={<Button onClick={() => navigate('/programs')}>Back</Button>}/></ScreenContainer></Layout>;
    const activate = async () => { try { setError(''); await programs.activate(program.id); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not activate program.'); } };
    const start = async () => { const day = program.days[program.currentDayIndex % program.days.length]; if (!day?.exercises.length) { setError('The next day contains no exercises.'); return; } try { await workout.startProgramDay(programDayWorkoutInput(program.name, day)); navigate('/workout/active'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start workout.'); } };
    return <Layout title={program.name} hideNav><ScreenContainer><SectionHeader eyebrow={statusLabel(program.status).toUpperCase()} title={program.name} action={<Stack direction="row" gap={1}>{program.status !== 'active' && <SecondaryButton onClick={activate}>Activate</SecondaryButton>}{program.status === 'active' && <PrimaryButton startIcon={<FitnessCenter/>} onClick={start}>Start {program.days[program.currentDayIndex % program.days.length]?.name}</PrimaryButton>}</Stack>}/>{error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}<Stack direction="row" gap={1} flexWrap="wrap" sx={{mb: 2}}><Chip label={`${program.weeklyFrequency} days/week`}/><Chip label={`${program.defaultDurationMinutes} min`}/><Chip label={`${Object.keys(balance?.patterns ?? {}).length} movement patterns covered`}/></Stack>{balance?.warnings.map((warning) => <Alert key={warning} severity="info" sx={{mb: 1}}>{warning}</Alert>)}<Stack spacing={2} sx={{mt: 2}}>{program.days.map((day) => <DayEditor key={day.id} day={day}/>)}</Stack><Divider sx={{my: 3}}/><Stack direction="row" justifyContent="space-between"><Button onClick={() => navigate('/programs')}>Back to programs</Button><Button color="error" startIcon={<Archive/>} onClick={async () => { await programs.archive(program.id); navigate('/programs'); }}>Archive</Button></Stack></ScreenContainer></Layout>;
}
