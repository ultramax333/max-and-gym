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

function ExerciseCard({exercise, onOpen, onToggleFavourite}: {exercise: LibraryExercise; onOpen: () => void; onToggleFavourite: () => void}) {
    const thumbnail = exercise.media.find((media) => media.kind === 'thumbnail');
    return <Card><CardActionArea onClick={onOpen}><Stack direction="row"><CardMedia component="img" image={thumbnail ? mediaUrl(thumbnail.path) : undefined} alt={thumbnail?.altText ?? ''} loading="lazy" sx={{width: 104, height: 104, bgcolor: 'background.default', objectFit: 'cover'}}/><CardContent sx={{minWidth: 0, flex: 1, py: 1.5}}><Stack direction="row" justifyContent="space-between" gap={1}><Typography component="h2" variant="h6" sx={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{exercise.name}</Typography><Button aria-label={exercise.favourite ? 'Retirer des favoris' : 'Ajouter aux favoris'} size="small" onClick={(event) => { event.stopPropagation(); onToggleFavourite(); }}>{exercise.favourite ? <Favorite color="error"/> : <FavoriteBorder/>}</Button></Stack><Stack direction="row" flexWrap="wrap" gap={0.5} sx={{mt: 0.5}}><Chip size="small" label={exercise.equipmentTags[0]}/><Chip size="small" label={exercise.movementPattern}/>{exercise.effectiveNeverSuggest && <Chip size="small" color="warning" icon={<Block/>} label="Jamais proposer"/>}</Stack></CardContent></Stack></CardActionArea></Card>;
}

function FiltersDialog({open, filters, onClose}: {open: boolean; filters: LibraryFilters; onClose: (filters: LibraryFilters) => void}) {
    const [draft, setDraft] = useState(filters);
    useEffect(() => setDraft(filters), [filters]);
    return <Dialog open={open} fullScreen onClose={() => onClose(filters)}><DialogTitle>Filtres de la bibliothèque</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        <FormControl fullWidth><InputLabel id="equipment-filter">Équipement</InputLabel><Select labelId="equipment-filter" label="Équipement" value={draft.equipment ?? ''} onChange={(event) => setDraft({...draft, equipment: event.target.value || undefined})}><MenuItem value="">Tous</MenuItem>{['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="movement-filter">Mouvement</InputLabel><Select labelId="movement-filter" label="Mouvement" value={draft.movementPattern ?? ''} onChange={(event) => setDraft({...draft, movementPattern: event.target.value || undefined})}><MenuItem value="">Tous</MenuItem>{['squat', 'hinge', 'push', 'pull', 'carry', 'core', 'accessory'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="muscle-filter">Muscle</InputLabel><Select labelId="muscle-filter" label="Muscle" value={draft.muscle ?? ''} onChange={(event) => setDraft({...draft, muscle: event.target.value || undefined})}><MenuItem value="">Tous</MenuItem>{['chest', 'lats', 'quadriceps', 'hamstrings', 'glutes', 'shoulders', 'biceps', 'triceps', 'abdominals', 'calves'].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel id="position-filter">Position</InputLabel><Select labelId="position-filter" label="Position" value={draft.position ?? ''} onChange={(event) => setDraft({...draft, position: event.target.value || undefined})}><MenuItem value="">Toutes</MenuItem><MenuItem value="standing-or-supported">Debout ou soutenu</MenuItem><MenuItem value="floor">Au sol</MenuItem></Select></FormControl>
        <FormControl fullWidth><InputLabel id="status-filter">Statut</InputLabel><Select labelId="status-filter" label="Statut" value={draft.status ?? 'all'} onChange={(event) => setDraft({...draft, status: event.target.value as LibraryFilters['status']})}><MenuItem value="all">Tous les exercices</MenuItem><MenuItem value="eligible">Éligibles aux programmes</MenuItem><MenuItem value="never-suggest">Jamais proposer</MenuItem></Select></FormControl>
    </Stack></DialogContent><DialogActions><Button onClick={() => { setDraft({}); onClose({}); }}>Effacer</Button><PrimaryButton onClick={() => onClose(draft)}>Appliquer</PrimaryButton></DialogActions></Dialog>;
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
            setError(reason instanceof Error ? reason.message : 'Impossible de créer cet exercice.');
        }
    };
    return <Dialog open={open} onClose={onClose} fullWidth><DialogTitle>Exercice personnalisé</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>{error && <Alert severity="error">{error}</Alert>}<TextField autoFocus label="Nom" value={name} onChange={(event) => setName(event.target.value)}/><TextField label="Équipement" value={equipment} onChange={(event) => setEquipment(event.target.value)}/><TextField label="Muscle principal" value={muscle} onChange={(event) => setMuscle(event.target.value)}/><Button component="label" startIcon={<ImageIcon/>}>Choisir une image locale<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event: ChangeEvent<HTMLInputElement>) => setImage(event.target.files?.[0])}/></Button>{image && <Typography variant="caption">{image.type} · {Math.round(image.size / 1024)} Ko</Typography>}</Stack></DialogContent><DialogActions><Button onClick={onClose}>Annuler</Button><PrimaryButton onClick={() => void create()}>Créer</PrimaryButton></DialogActions></Dialog>;
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
    return <Layout title="Bibliothèque" hideBack><ScreenContainer><Stack spacing={2}><Typography component="h1" variant="h4">Bibliothèque</Typography><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><TextField fullWidth label="Rechercher un exercice" value={filters.search ?? ''} onChange={(event) => setFilters({...filters, search: event.target.value || undefined})} InputProps={{startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>}}/><Button variant="outlined" startIcon={<FilterAlt/>} onClick={() => setFiltersOpen(true)}>Filtres</Button><Button variant="outlined" startIcon={<Add/>} onClick={() => setCustomOpen(true)}>Créer</Button></Stack>
        <Typography color="text.secondary">{loading ? 'Chargement…' : `${exercises.length} exercices locaux`}</Typography>
        {!loading && exercises.length === 0 && <StatePanel title="Aucun exercice trouvé" description="Modifie ta recherche ou tes filtres. Les exercices personnalisés restent sur cet appareil."/>}
        <Box sx={{display: 'grid', gap: 1.5, gridTemplateColumns: {xs: '1fr', md: 'repeat(2, minmax(0, 1fr))'}}}>{exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} onOpen={() => navigate(`/library/${encodeURIComponent(exercise.id)}`)} onToggleFavourite={() => { if (catalog) void catalog.updatePreference(exercise.id, {favourite: !exercise.favourite}).then(refresh); }}/>)}</Box>
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
    if (!exercise) return <Layout title="Exercice" hideNav><ScreenContainer><StatePanel title="Exercice introuvable" description="Il a peut-être été retiré de ce catalogue local." action={<Button onClick={() => navigate('/library')}>Retour à la bibliothèque</Button>}/></ScreenContainer></Layout>;
    const start = exercise.media.find((media) => media.kind === 'start-image');
    const end = exercise.media.find((media) => media.kind === 'end-image');
    const toggle = async (change: {favourite?: boolean; neverSuggest?: boolean}) => { await catalog?.updatePreference(exercise.id, change); await refresh(); };
    return <Layout title={exercise.name} hideNav><ScreenContainer><Stack spacing={2}><Stack direction="row" flexWrap="wrap" gap={1}><Chip label={exercise.contentStatus}/><Chip label={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'Éligible aux programmes' : 'Non proposé automatiquement'} color={exercise.generatorEligible && !exercise.effectiveNeverSuggest ? 'success' : 'warning'}/><Chip label={exercise.equipmentTags.join(', ')}/></Stack>
        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 1}}>{customUrl && <CardMedia component="img" image={customUrl} alt={`${exercise.name} image locale`} sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{start && !customUrl && <CardMedia component="img" image={mediaUrl(start.path)} alt={start.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}{end && !customUrl && <CardMedia component="img" image={mediaUrl(end.path)} alt={end.altText} loading="lazy" sx={{width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 2}}/>}</Box>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={1}><Button startIcon={exercise.favourite ? <Favorite/> : <FavoriteBorder/>} onClick={() => void toggle({favourite: !exercise.favourite})}>{exercise.favourite ? 'Favori' : 'Ajouter aux favoris'}</Button><Button color="warning" startIcon={<Block/>} onClick={() => void toggle({neverSuggest: !exercise.effectiveNeverSuggest})}>{exercise.effectiveNeverSuggest ? 'Autoriser la proposition' : 'Jamais proposer'}</Button></Stack>
        <Card><CardContent><Typography component="h1" variant="h4">{exercise.name}</Typography><Typography color="text.secondary">{exercise.movementPattern} · {exercise.primaryMuscles.join(', ')}</Typography></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Installation</Typography><Typography>{exercise.setupInstructions}</Typography><Divider sx={{my: 2}}/><Typography component="h2" variant="h6">Exécution</Typography><Box component="ol">{exercise.executionSteps.map((step) => <li key={step}><Typography>{step}</Typography></li>)}</Box><Typography component="h2" variant="h6">Respiration</Typography><Typography>{exercise.breathingCue}</Typography><Typography component="h2" variant="h6" sx={{mt: 2}}>Erreurs fréquentes</Typography><Box component="ul">{exercise.commonMistakes.map((mistake) => <li key={mistake}><Typography>{mistake}</Typography></li>)}</Box></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Alternatives</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{mt: 1}}>{alternatives.length ? alternatives.map((alternative) => <Chip key={alternative.id} label={alternative.name} onClick={() => navigate(`/library/${encodeURIComponent(alternative.id)}`)}/>) : <Typography color="text.secondary">Aucune alternative locale.</Typography>}</Stack></CardContent></Card>
        <Card><CardContent><Typography component="h2" variant="h6">Source et licence</Typography><Typography>{exercise.sourceName} · {exercise.license}</Typography>{exercise.sourceUrl && <Button startIcon={<OpenInNew/>} href={exercise.sourceUrl} target="_blank">Voir la source</Button>}</CardContent></Card>
    </Stack></ScreenContainer></Layout>;
}
