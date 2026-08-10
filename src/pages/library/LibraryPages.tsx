import React, {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react';
import {Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {Add, Block, Favorite, FavoriteBorder, FilterAlt, Image as ImageIcon, OpenInNew, Search} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, StatePanel} from '../../components/ui/UiPrimitives';
import {LibraryExercise, LibraryFilters} from '../../exerciseCatalog/types';
import {useExerciseCatalog} from '../../exerciseCatalog/useExerciseCatalog';

function mediaUrl(path: string): string {
    return `${import.meta.env.BASE_URL}${path}`;
}

function ExerciseCard({exercise, onOpen, onToggleFavourite, onToggleNeverSuggest}: {exercise: LibraryExercise; onOpen: () => void; onToggleFavourite: () => void; onToggleNeverSuggest: () => void}) {
    const thumbnail = exercise.media.find((media) => media.kind === 'thumbnail');
    return <Card><CardActionArea onClick={onOpen}><Stack direction="row"><CardMedia component="img" image={thumbnail ? mediaUrl(thumbnail.path) : undefined} alt={thumbnail?.altText ?? ''} loading="lazy" sx={{width: 104, height: 104, bgcolor: 'background.default', objectFit: 'cover'}}/><CardContent sx={{minWidth: 0, flex: 1, py: 1.5}}><Stack direction="row" justifyContent="space-between" gap={1}><Typography component="h2" variant="h6" sx={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{exercise.name}</Typography><Stack direction="row"><Button aria-label={exercise.effectiveNeverSuggest ? 'Excluded exercises cannot be favourites' : exercise.favourite ? 'Remove from favourites' : 'Add to favourites'} disabled={exercise.effectiveNeverSuggest} size="small" onClick={(event) => { event.stopPropagation(); onToggleFavourite(); }}>{exercise.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</Button><Button aria-label={exercise.neverSuggest ? `${exercise.name} is excluded by the catalogue` : exercise.effectiveNeverSuggest ? `Allow ${exercise.name} in suggestions` : `Never suggest ${exercise.name}`} color={exercise.effectiveNeverSuggest ? 'warning' : 'inherit'} disabled={exercise.neverSuggest} size="small" onClick={(event) => { event.stopPropagation(); onToggleNeverSuggest(); }}><Block/></Button></Stack></Stack><Stack direction="row" flexWrap="wrap" gap={0.5} sx={{mt: 0.5}}><Chip size="small" label={exercise.equipmentTags[0]}/><Chip size="small" label={exercise.movementPattern}/>{exercise.effectiveNeverSuggest && <Chip size="small" color="warning" icon={<Block/>} label={exercise.neverSuggest ? 'Catalogue exclusion' : 'Never Suggest'}/>}</Stack></CardContent></Stack></CardActionArea></Card>;
}

function FiltersDialog({open, filters, onClose}: {open: boolean; filters: LibraryFilters; onClose: (filters: LibraryFilters) => void}) {
    const [draft, setDraft] = useState(filters);
    useEffect(() => setDraft(filters), [filters]);
    return <Dialog open={open} fullScreen onClose={() => onClose(filters)}><DialogTitle>Library filters</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        <FormControl fullWidth><InputLabel id="equipment-filter">Equipment</InputLabel><Select labelId="equipment-filter" label="Equipment" value={draft.equipment ?? ''} onChange={(event) => setDraft({...draft, equipment: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="movement-filter">Movement</InputLabel><Select labelId="movement-filter" label="Movement" value={draft.movementPattern ?? ''} onChange={(event) => setDraft({...draft, movementPattern: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['squat', 'hinge', 'push', 'pull', 'carry', 'core', 'accessory'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="muscle-filter">Muscle</InputLabel><Select labelId="muscle-filter" label="Muscle" value={draft.muscle ?? ''} onChange={(event) => setDraft({...draft, muscle: event.target.value || undefined})}><MenuItem value="">All</MenuItem>{['chest', 'lats', 'quadriceps', 'hamstrings', 'glutes', 'shoulders', 'biceps', 'triceps', 'abdominals', 'calves'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
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
    return <Layout title="Library" hideBack><ScreenContainer><Stack spacing={2}><Typography component="h1" variant="h4">Library</Typography><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><TextField fullWidth label="Search exercises" value={filters.search ?? ''} onChange={(event) => setFilters({...filters, search: event.target.value || undefined})} InputProps={{startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>}}/><Button variant="outlined" startIcon={<FilterAlt/>} onClick={() => setFiltersOpen(true)}>Filters</Button><Button variant="outlined" startIcon={<Add/>} onClick={() => setCustomOpen(true)}>Create</Button></Stack>
        <Typography color="text.secondary">{loading ? 'Loading…' : `${exercises.length} local exercises`}</Typography>
        {!loading && exercises.length === 0 && <StatePanel title="No exercise found" description="Change your search or filters. Custom exercises remain on this device."/>}
        <Box sx={{display: 'grid', gap: 1.5, gridTemplateColumns: {xs: '1fr', md: 'repeat(2, minmax(0, 1fr))'}}}>{exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} onOpen={() => navigate(`/library/${encodeURIComponent(exercise.id)}`)} onToggleFavourite={() => { if (catalog) void catalog.updatePreference(exercise.id, {favourite: !exercise.favourite}).then(refresh); }} onToggleNeverSuggest={() => { if (catalog) void catalog.updatePreference(exercise.id, {neverSuggest: !exercise.effectiveNeverSuggest}).then(refresh); }}/>)}</Box>
    </Stack></ScreenContainer><FiltersDialog open={filtersOpen} filters={filters} onClose={(next) => { setFiltersOpen(false); setFilters(next); }}/><CustomExerciseDialog open={customOpen} onClose={() => setCustomOpen(false)} onCreated={() => void refresh()}/></Layout>;
}

export function ExerciseDetailPage() {
    const {exerciseId = ''} = useParams();
    const catalog = useExerciseCatalog();
    const navigate = useNavigate();
    const [exercise, setExercise] = useState<LibraryExercise>();
    const [alternatives, setAlternatives] = useState<LibraryExercise[]>([]);
    const [customUrl, setCustomUrl] = useState<string>();
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
    return <Layout title={exercise.name} hideNav><ScreenContainer><Stack spacing={2}><Stack direction="row" flexWrap="wrap" gap={1}><Chip label={exercise.contentStatus}/><Chip label={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'Program eligible' : 'Not suggested automatically'} color={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'success' : 'warning'}/><Chip label={exercise.equipmentTags.join(', ')}/></Stack>
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 1}}>{customUrl && <CardMedia component="img" image={customUrl} alt={`${exercise.name} image locale`} sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{start && !customUrl && <CardMedia component="img" image={mediaUrl(start.path)} alt={start.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{end && !customUrl && <CardMedia component="img" image={mediaUrl(end.path)} alt={end.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}</Box>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={1}><Button startIcon={exercise.favourite ? <Favorite/> : <FavoriteBorder/>} disabled={exercise.effectiveNeverSuggest} onClick={() => void toggle({favourite: !exercise.favourite})}>{exercise.effectiveNeverSuggest ? 'Excluded from favourites' : exercise.favourite ? 'Favourite' : 'Add to favourites'}</Button><Button color="warning" startIcon={<Block/>} disabled={exercise.neverSuggest} onClick={() => void toggle({neverSuggest: !exercise.effectiveNeverSuggest})}>{exercise.neverSuggest ? 'Excluded by catalogue' : exercise.effectiveNeverSuggest ? 'Allow suggestions' : 'Never Suggest'}</Button></Stack>
        <Card><CardContent><Typography component="h1" variant="h4">{exercise.name}</Typography><Typography color="text.secondary">{exercise.movementPattern} · {exercise.primaryMuscles.join(', ')}</Typography></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Setup</Typography><Typography>{exercise.setupInstructions}</Typography><Divider sx={{my: 2}}/><Typography component="h2" variant="h6">Execution</Typography><Box component="ol">{exercise.executionSteps.map((step) => <li key={step}><Typography>{step}</Typography></li>)}</Box><Typography component="h2" variant="h6">Breathing</Typography><Typography>{exercise.breathingCue}</Typography><Typography component="h2" variant="h6" sx={{mt: 2}}>Common mistakes</Typography><Box component="ul">{exercise.commonMistakes.map((mistake) => <li key={mistake}><Typography>{mistake}</Typography></li>)}</Box></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Alternatives</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{mt: 1}}>{alternatives.length ? alternatives.map((alternative) => <Chip key={alternative.id} label={alternative.name} onClick={() => navigate(`/library/${encodeURIComponent(alternative.id)}`)}/>) : <Typography color="text.secondary">No local alternative.</Typography>}</Stack></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Source and licence</Typography><Typography>{exercise.sourceName} · {exercise.license}</Typography>{exercise.sourceUrl && <Button startIcon={<OpenInNew/>} href={exercise.sourceUrl} target="_blank">View source</Button>}</CardContent></Card>
    </Stack></ScreenContainer></Layout>;
}
