import {EquipmentBadges} from '../../components/ui/EquipmentBadge';
import React, {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {Add, Block, Edit, Favorite, FavoriteBorder, FilterAlt, FitnessCenter, Image as ImageIcon, OpenInNew, Search} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {LibraryExercise, LibraryFilters} from '../../exerciseCatalog/types';
import {useExerciseCatalog} from '../../exerciseCatalog/useExerciseCatalog';
import {EquipmentStation, EQUIPMENT_STATIONS, requiredStations} from '../../workout/equipmentStations';

function mediaUrl(path: string): string {
    return `${import.meta.env.BASE_URL}${path}`;
}

function ExerciseCard({exercise, onOpen, onToggleFavourite, onToggleNeverSuggest}: {exercise: LibraryExercise; onOpen: () => void; onToggleFavourite: () => void; onToggleNeverSuggest: () => void}) {
    const thumbnail = exercise.media.find((media) => media.kind === 'thumbnail');
    return <Card sx={{overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        <CardActionArea onClick={onOpen} sx={{flex: 1}}>
            <Box sx={{position: 'relative', height: 184, bgcolor: 'background.default'}}>
                {thumbnail ? <CardMedia component="img" image={mediaUrl(thumbnail.path)} alt={thumbnail.altText} loading="lazy" sx={{width: '100%', height: '100%', objectFit: 'contain'}}/>
                    : <Stack alignItems="center" justifyContent="center" spacing={1} sx={{height: '100%', color: 'text.secondary'}}><FitnessCenter/><Typography variant="caption">No photo</Typography></Stack>}
                <Chip size="small" label={exercise.primaryMuscles[0] ?? 'Exercise'} sx={{position: 'absolute', left: 12, bottom: 12, bgcolor: 'rgba(12,14,16,.9)', color: 'text.primary', textTransform: 'capitalize'}}/>
            </Box>
            <CardContent sx={{pb: 1.5}}>
                <Typography component="h2" variant="h6" sx={{mb: 1, overflowWrap: 'anywhere'}}>{exercise.name}</Typography>
                <EquipmentBadges exercise={exercise}/>
            </CardContent>
        </CardActionArea>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{px: 1.5, pb: 1, borderTop: '1px solid', borderColor: 'divider'}}>
            <Typography variant="caption" color={exercise.effectiveNeverSuggest ? 'warning.main' : 'text.secondary'} sx={{textTransform: 'capitalize', pl: 1}}>
                {exercise.effectiveNeverSuggest ? 'Never suggest' : exercise.movementPattern}
            </Typography>
            <Stack direction="row">
                <IconButton aria-label={exercise.effectiveNeverSuggest ? 'Excluded exercises cannot be favourites' : exercise.favourite ? 'Remove from favourites' : 'Add to favourites'} disabled={exercise.effectiveNeverSuggest} onClick={onToggleFavourite}>{exercise.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</IconButton>
                <IconButton aria-label={exercise.neverSuggest ? `${exercise.name} is excluded by the catalogue` : exercise.effectiveNeverSuggest ? `Allow ${exercise.name} in suggestions` : `Never suggest ${exercise.name}`} color={exercise.effectiveNeverSuggest ? 'warning' : 'default'} disabled={exercise.neverSuggest} onClick={onToggleNeverSuggest}><Block/></IconButton>
            </Stack>
        </Stack>
    </Card>;
}

function FiltersDialog({open, filters, onClose}: {open: boolean; filters: LibraryFilters; onClose: (filters: LibraryFilters) => void}) {
    const [draft, setDraft] = useState(filters);
    useEffect(() => setDraft(filters), [filters]);
    return <Dialog open={open} fullScreen onClose={() => onClose(filters)}><DialogTitle>Library filters</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        <FormControl fullWidth><InputLabel id="equipment-filter">Equipment</InputLabel><Select labelId="equipment-filter" label="Equipment" value={draft.equipment ?? ''} onChange={(event) => setDraft({...draft, equipment: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="movement-filter">Movement</InputLabel><Select labelId="movement-filter" label="Movement" value={draft.movementPattern ?? ''} onChange={(event) => setDraft({...draft, movementPattern: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['squat', 'hinge', 'push', 'pull', 'carry', 'core', 'accessory'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="muscle-filter">Muscle</InputLabel><Select labelId="muscle-filter" label="Muscle" value={draft.muscle ?? ''} onChange={(event) => setDraft({...draft, muscle: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['chest', 'lats', 'middle back', 'lower back', 'traps', 'quadriceps', 'hamstrings', 'glutes', 'abductors', 'adductors', 'shoulders', 'biceps', 'triceps', 'forearms', 'abdominals', 'calves'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControlLabel control={<Checkbox checked={draft.includeSecondaryMuscles ?? false} onChange={event => setDraft({...draft, includeSecondaryMuscles: event.target.checked})}/>} label="Include secondary muscles"/>
        <Typography variant="body2" color="text.secondary">Primary muscle only by default. Secondary involvement alone does not qualify a focused session; the optional mixed lower-back area uses a small reviewed list.</Typography>
        <FormControl fullWidth><InputLabel id="position-filter">Position</InputLabel><Select labelId="position-filter" label="Position" value={draft.position ?? ''} onChange={(event) => setDraft({...draft, position: event.target.value || undefined})}><MenuItem value="">All</MenuItem><MenuItem value="standing-or-supported">Standing or supported</MenuItem><MenuItem value="floor">Floor</MenuItem></Select></FormControl>
        <FormControl fullWidth><InputLabel id="status-filter">Status</InputLabel><Select labelId="status-filter" label="Status" value={draft.status ?? 'all'} onChange={(event) => setDraft({...draft, status: event.target.value as LibraryFilters['status']})}><MenuItem value="all">All exercises</MenuItem><MenuItem value="eligible">Program eligible</MenuItem><MenuItem value="never-suggest">Never Suggest</MenuItem></Select></FormControl>
    </Stack></DialogContent><DialogActions><Button onClick={() => { setDraft({}); onClose({}); }}>Clear</Button><PrimaryButton onClick={() => onClose(draft)}>Apply</PrimaryButton></DialogActions></Dialog>;
}

function CustomExerciseDialog({open, onClose, onCreated}: {open: boolean; onClose: () => void; onCreated: () => void}) {
    const catalog = useExerciseCatalog();
    const [name, setName] = useState('');
    const [equipment, setEquipment] = useState('dumbbell');
    const [muscle, setMuscle] = useState('chest');
    const [image, setImage] = useState<Blob>();
    const [error, setError] = useState<string>();
    const create = async () => {
        if (!catalog) return;
        try {
            await catalog.createCustom({name, equipment, primaryMuscle: muscle, image});
            setName('');
            setImage(undefined);
            onCreated();
            onClose();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not create this exercise.');
        }
    };
    return <Dialog open={open} onClose={onClose} fullWidth><DialogTitle>Custom exercise</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>{error && <Alert severity="error">{error}</Alert>}<TextField autoFocus label="Name" value={name} onChange={(event) => setName(event.target.value)}/><TextField label="Equipment" value={equipment} onChange={(event) => setEquipment(event.target.value)}/><TextField label="Primary muscle" value={muscle} onChange={(event) => setMuscle(event.target.value)}/><Button component="label" startIcon={<ImageIcon/>}>Choose a local image<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setImage(event.target.files?.[0])}/></Button>{image && <Typography variant="caption">{image.type} · {Math.round(image.size / 1024)} KB</Typography>}</Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><PrimaryButton onClick={() => void create()}>Create</PrimaryButton></DialogActions></Dialog>;
}

function EquipmentEditorDialog({exercise, open, onClose, onSaved}: {exercise: LibraryExercise; open: boolean; onClose: () => void; onSaved: () => void}) {
    const catalog = useExerciseCatalog();
    const inferred = useMemo(() => requiredStations(exercise), [exercise]);
    const [stations, setStations] = useState<EquipmentStation[]>(inferred);
    const [primary, setPrimary] = useState<EquipmentStation>(exercise.primaryEquipmentStation ?? inferred[0] ?? 'other');
    const [difficulty, setDifficulty] = useState<'normal' | 'limited' | 'hard'>(exercise.accessDifficulty ?? 'normal');
    const [stationCount, setStationCount] = useState<1 | 2>(exercise.requiredStationCount ?? 1);
    useEffect(() => {
        if (!open) return;
        const next = requiredStations(exercise);
        setStations(next);
        setPrimary(exercise.primaryEquipmentStation ?? next[0] ?? 'other');
        setDifficulty(exercise.accessDifficulty ?? 'normal');
        setStationCount(exercise.requiredStationCount ?? 1);
    }, [exercise, open]);
    const save = async () => {
        if (!catalog || stations.length === 0) return;
        await catalog.updatePreference(exercise.id, {
            requiredEquipmentStations: stations,
            primaryEquipmentStation: stations.includes(primary) ? primary : stations[0],
            accessDifficulty: difficulty,
            requiredStationCount: stationCount,
        });
        onSaved();
        onClose();
    };
    const reset = async () => {
        await catalog?.resetEquipmentPreference(exercise.id);
        onSaved();
        onClose();
    };
    return <Dialog open={open} onClose={onClose} fullWidth><DialogTitle>Equipment and access</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        <Alert severity="info">Select every item required. The primary item is used to group this exercise in a workout.</Alert>
        <FormControl fullWidth><InputLabel id="required-equipment">Required equipment</InputLabel><Select labelId="required-equipment" multiple label="Required equipment" value={stations} renderValue={(selected) => selected.map((station) => EQUIPMENT_STATIONS[station].label).join(', ')} onChange={(event) => {
            const next = event.target.value as EquipmentStation[];
            if (!next.length) return;
            setStations(next);
            if (!next.includes(primary)) setPrimary(next[0]);
        }}>{Object.entries(EQUIPMENT_STATIONS).map(([id, details]) => <MenuItem key={id} value={id}><Checkbox checked={stations.includes(id as EquipmentStation)}/>{details.label}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="primary-equipment">Primary grouping equipment</InputLabel><Select labelId="primary-equipment" label="Primary grouping equipment" value={primary} onChange={(event) => setPrimary(event.target.value as EquipmentStation)}>{stations.map((station) => <MenuItem key={station} value={station}>{EQUIPMENT_STATIONS[station].label}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="access-difficulty">Access difficulty</InputLabel><Select labelId="access-difficulty" label="Access difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><MenuItem value="normal">Normal access</MenuItem><MenuItem value="limited">Often occupied</MenuItem><MenuItem value="hard">Hard to access at peak hours</MenuItem></Select></FormControl>
        <FormControl fullWidth><InputLabel id="station-count">Stations needed at once</InputLabel><Select labelId="station-count" label="Stations needed at once" value={stationCount} onChange={(event) => setStationCount(Number(event.target.value) as 1 | 2)}><MenuItem value={1}>One station</MenuItem><MenuItem value={2}>Two stations</MenuItem></Select></FormControl>
        <Typography variant="body2" color="text.secondary">At busy times, exercises marked hard or needing two stations are moved down the generator ranking. They remain available if the session has no coherent alternative.</Typography>
    </Stack></DialogContent><DialogActions><Button color="inherit" onClick={() => void reset()}>Restore catalogue defaults</Button><Button onClick={onClose}>Cancel</Button><PrimaryButton disabled={!stations.length} onClick={() => void save()}>Save</PrimaryButton></DialogActions></Dialog>;
}

export function LibraryPage() {
    const catalog = useExerciseCatalog();
    const navigate = useNavigate();
    const [filters, setFilters] = useState<LibraryFilters>({});
    const [exercises, setExercises] = useState<LibraryExercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const refresh = useCallback(async () => {
        if (!catalog) return;
        setLoading(true);
        setExercises(await catalog.list(filters));
        setLoading(false);
    }, [catalog, filters]);
    useEffect(() => { void refresh(); }, [refresh]);
    return <Layout title="Library" hideBack><ScreenContainer><Stack spacing={2}><SectionHeader eyebrow="LOCAL EXERCISE CATALOGUE" title="Library" action={!loading && <Chip color="primary" label={`${exercises.length} exercises`}/>}/><Stack direction="row" flexWrap="wrap" gap={1}><TextField sx={{flexBasis: {xs: '100%', sm: 0}, flexGrow: 1}} fullWidth label="Search exercises" value={filters.search ?? ''} onChange={(event) => setFilters({...filters, search: event.target.value || undefined})} InputProps={{startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>}}/><Button sx={{flex: {xs: 1, sm: 'none'}}} variant="outlined" startIcon={<FilterAlt/>} onClick={() => setFiltersOpen(true)}>Filters</Button><Button sx={{flex: {xs: 1, sm: 'none'}}} variant="outlined" startIcon={<Add/>} onClick={() => setCustomOpen(true)}>Create</Button></Stack>
        <Stack direction="row" gap={1} flexWrap="wrap"><Chip clickable label="All movements" variant={!filters.status ? 'filled' : 'outlined'} color={!filters.status ? 'primary' : 'default'} onClick={() => setFilters({...filters, status: undefined})}/><Chip clickable icon={<Block/>} label="Excluded" variant={filters.status === 'never-suggest' ? 'filled' : 'outlined'} color={filters.status === 'never-suggest' ? 'warning' : 'default'} onClick={() => setFilters({...filters, status: 'never-suggest'})}/><Chip clickable label="For my sessions" variant={filters.status === 'eligible' ? 'filled' : 'outlined'} color={filters.status === 'eligible' ? 'primary' : 'default'} onClick={() => setFilters({...filters, status: 'eligible'})}/></Stack>
        <Typography variant="body2" color="text.secondary">{loading ? 'Loading…' : 'Reviewed movements, local photos and your own preferences.'}</Typography>
        {!loading && exercises.length === 0 && <StatePanel title="No exercise found" description="Change your search or filters. Custom exercises remain on this device."/>}
        <Box sx={{display: 'grid', gap: 1.5, gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))'}}}>{exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} onOpen={() => navigate(`/library/${encodeURIComponent(exercise.id)}`)} onToggleFavourite={() => { if (catalog) void catalog.updatePreference(exercise.id, {favourite: !exercise.favourite}).then(refresh); }} onToggleNeverSuggest={() => { if (catalog) void catalog.updatePreference(exercise.id, {neverSuggest: !exercise.effectiveNeverSuggest}).then(refresh); }}/>)}</Box>
    </Stack></ScreenContainer><FiltersDialog open={filtersOpen} filters={filters} onClose={(next) => { setFiltersOpen(false); setFilters(next); }}/><CustomExerciseDialog open={customOpen} onClose={() => setCustomOpen(false)} onCreated={() => void refresh()}/></Layout>;
}

export function ExerciseDetailPage() {
    const {exerciseId = ''} = useParams();
    const catalog = useExerciseCatalog();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState<LibraryExercise>();
    const [alternatives, setAlternatives] = useState<LibraryExercise[]>([]);
    const [customUrl, setCustomUrl] = useState<string>();
    const [equipmentOpen, setEquipmentOpen] = useState(false);
    const refresh = useCallback(async () => {
        if (!catalog) return;
        const item = await catalog.get(exerciseId);
        setExercise(item);
        setAlternatives(item ? await catalog.alternatives(item) : []);
    }, [catalog, exerciseId]);
    useEffect(() => { void refresh(); }, [refresh]);
    useEffect(() => {
        let objectUrl: string | undefined;
        if (!exercise || exercise.source !== 'maxgym') return undefined;
        void (async () => {
            const item = await catalog?.get(exercise.id);
            const custom = item as LibraryExercise & {customImage?: Blob};
            if (custom.customImage) {
                objectUrl = URL.createObjectURL(custom.customImage);
                setCustomUrl(objectUrl);
            }
        })();
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [catalog, exercise]);
    if (!exercise) return <Layout title="Exercise" hideNav><ScreenContainer><StatePanel title="Exercise not found" description="It may have been removed from this local catalogue." action={<Button onClick={() => navigate('/library')}>Back to library</Button>}/></ScreenContainer></Layout>;
    const start = exercise.media.find((media) => media.kind === 'start-image');
    const end = exercise.media.find((media) => media.kind === 'end-image');
    const toggle = async (change: {favourite?: boolean; neverSuggest?: boolean}) => { await catalog?.updatePreference(exercise.id, change); await refresh(); };
    return <Layout title={exercise.name} hideNav><ScreenContainer><Stack spacing={2}><Stack direction="row" flexWrap="wrap" gap={1}><Chip label={exercise.contentStatus}/><Chip label={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'Program eligible' : 'Not suggested automatically'} color={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'success' : 'warning'}/><EquipmentBadges exercise={exercise}/>{exercise.accessDifficulty && exercise.accessDifficulty !== 'normal' && <Chip color="warning" variant="outlined" label={exercise.accessDifficulty === 'hard' ? 'Hard access' : 'Often occupied'}/>} {exercise.requiredStationCount === 2 && <Chip color="warning" variant="outlined" label="2 stations"/>}</Stack>
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 1}}>{customUrl && <CardMedia component="img" image={customUrl} alt={`${exercise.name} image locale`} sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{start && !customUrl && <CardMedia component="img" image={mediaUrl(start.path)} alt={start.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{end && !customUrl && <CardMedia component="img" image={mediaUrl(end.path)} alt={end.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}</Box>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={1}><Button startIcon={exercise.favourite ? <Favorite/> : <FavoriteBorder/>} disabled={exercise.effectiveNeverSuggest} onClick={() => void toggle({favourite: !exercise.favourite})}>{exercise.effectiveNeverSuggest ? 'Excluded from favourites' : exercise.favourite ? 'Favourite' : 'Add to favourites'}</Button><Button color="warning" startIcon={<Block/>} disabled={exercise.neverSuggest} onClick={() => void toggle({neverSuggest: !exercise.effectiveNeverSuggest})}>{exercise.neverSuggest ? 'Excluded by catalogue' : exercise.effectiveNeverSuggest ? 'Allow suggestions' : 'Never Suggest'}</Button><Button startIcon={<Edit/>} variant="outlined" onClick={() => setEquipmentOpen(true)}>Correct equipment</Button></Stack>
        <Card><CardContent><Typography component="h1" variant="h4">{exercise.name}</Typography><Typography color="text.secondary">{exercise.movementPattern} · {exercise.primaryMuscles.join(', ')}</Typography></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Setup</Typography><Typography>{exercise.setupInstructions}</Typography><Divider sx={{my: 2}}/><Typography component="h2" variant="h6">Execution</Typography><Box component="ol">{exercise.executionSteps.map((step) => <li key={step}><Typography>{step}</Typography></li>)}</Box><Typography component="h2" variant="h6">Breathing</Typography><Typography>{exercise.breathingCue}</Typography><Typography component="h2" variant="h6" sx={{mt: 2}}>Common mistakes</Typography><Box component="ul">{exercise.commonMistakes.map((mistake) => <li key={mistake}><Typography>{mistake}</Typography></li>)}</Box></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Alternatives</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{mt: 1}}>{alternatives.length ? alternatives.map((alternative) => <Chip key={alternative.id} label={alternative.name} onClick={() => navigate(`/library/${encodeURIComponent(alternative.id)}`)}/>) : <Typography color="text.secondary">No local alternative.</Typography>}</Stack></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Source and licence</Typography><Typography>{exercise.sourceName} · {exercise.license}</Typography>{exercise.sourceUrl && <Button startIcon={<OpenInNew/>} href={exercise.sourceUrl} target="_blank">View source</Button>}</CardContent></Card>
    </Stack></ScreenContainer><EquipmentEditorDialog exercise={exercise} open={equipmentOpen} onClose={() => setEquipmentOpen(false)} onSaved={() => void refresh()}/></Layout>;
}
