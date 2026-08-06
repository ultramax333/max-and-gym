import React, {useEffect, useState} from 'react';
import {AddAPhoto, Backup, Delete, Edit, MonitorWeight, PhotoLibrary, Timeline} from '@mui/icons-material';
import {Alert, Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {MeasurementRepository} from '../../progress/MeasurementRepository';
import {PhotoRepository, PhotoStorageError} from '../../progress/PhotoRepository';
import {processPhoto} from '../../progress/photoPipeline';
import {ProgressRepository} from '../../progress/ProgressRepository';
import {BodyMeasurementRecord, BodyMeasurementType, ProgressPhotoPose, ProgressPhotoRecord} from '../../progress/types';

const progress = new ProgressRepository(db);
const measurements = new MeasurementRepository(db);
const photos = new PhotoRepository(db);
const measurementLabels: Record<BodyMeasurementType, string> = {weight: 'Poids', waist: 'Taille', chest: 'Poitrine', hips: 'Hanches', 'upper-arm': 'Bras', thigh: 'Cuisse', custom: 'Personnalisé'};
const poseLabels: Record<ProgressPhotoPose, string> = {front: 'Face', 'side-left': 'Profil gauche', 'side-right': 'Profil droit', back: 'Dos', custom: 'Personnalisé'};

function MiniBars({values}: {values: Array<{period: string; sessions: number}>}) {
    const max = Math.max(1, ...values.map((entry) => entry.sessions));
    return <Stack direction="row" gap={1} alignItems="flex-end" sx={{height: 110, pt: 1}} aria-label="Fréquence par semaine">{values.slice(-10).map((entry) => <Stack key={entry.period} alignItems="center" justifyContent="flex-end" sx={{height: '100%', flex: 1, minWidth: 24}}><Box sx={{width: '100%', maxWidth: 34, height: `${Math.max(8, entry.sessions / max * 72)}px`, bgcolor: 'primary.main', borderRadius: '6px 6px 2px 2px'}}/><Typography variant="caption">{entry.sessions}</Typography></Stack>)}</Stack>;
}

function SimpleLineChart({values, label}: {values: number[]; label: string}) {
    if (!values.length) return <Typography color="text.secondary">Aucune valeur pour la courbe.</Typography>;
    const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
    const points = values.map((value, index) => `${values.length === 1 ? 200 : index / (values.length - 1) * 400},${110 - (value - min) / range * 90}`).join(' ');
    return <Box component="svg" role="img" aria-label={label} viewBox="0 0 400 120" sx={{width: '100%', maxHeight: 150}}><polyline fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={points}/></Box>;
}

export function ProgressDashboardPage() {
    const navigate = useNavigate();
    const overview = useLiveQuery(() => progress.overview(), []);
    const history = useLiveQuery(() => progress.workoutHistory(), []) ?? [];
    const exercises = useLiveQuery(() => progress.exerciseOptions(), []) ?? [];
    if (!overview) return <Layout title="Progression" hideBack><ScreenContainer><Typography>Chargement…</Typography></ScreenContainer></Layout>;
    return <Layout title="Progression" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESSION" title="Une vue claire de ta régularité" action={<Button variant="outlined" startIcon={<Backup/>} onClick={() => navigate('/backup')}>Sauvegarde</Button>}/><Alert severity="info" sx={{mb: 2}}>{overview.textSummary}</Alert><Stack direction={{xs: 'column', md: 'row'}} gap={2}><Card sx={{flex: 1}}><CardContent><Typography variant="h6">Régularité hebdomadaire</Typography><MiniBars values={overview.weeklyFrequency}/><Typography color="text.secondary">Résumé texte : {overview.weeklyFrequency.length ? `${overview.weeklyFrequency.at(-1)?.sessions} séance(s) dans la dernière semaine enregistrée.` : 'Aucune semaine enregistrée.'}</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography variant="h6">Cumul</Typography><Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 2}}><Chip label={`${overview.completedSessions} séances`}/><Chip label={`${overview.totalSets} séries`}/><Chip label={`${Math.round(overview.totalVolumeKg)} kg volume`}/><Chip label={`${Math.round(overview.totalDurationSeconds / 60)} min`}/></Stack><Typography sx={{mt: 2}} color="text.secondary">Mouvements : {Object.entries(overview.movementDistribution).map(([key, value]) => `${key} ${value}`).join(' · ') || 'non classés'}</Typography></CardContent></Card></Stack><Stack direction={{xs: 'column', sm: 'row'}} gap={1} sx={{my: 2}}><PrimaryButton startIcon={<MonitorWeight/>} onClick={() => navigate('/progress/measurements')}>Mesures</PrimaryButton><Button variant="outlined" startIcon={<PhotoLibrary/>} onClick={() => navigate('/progress/photos')}>Photos locales</Button></Stack><Card><CardContent><Typography variant="h6">Progression par exercice</Typography>{exercises.length ? <Stack direction="row" gap={1} flexWrap="wrap" sx={{mt: 1}}>{exercises.map((entry) => <Button key={entry.exerciseId} onClick={() => navigate(`/progress/exercise/${encodeURIComponent(entry.exerciseId)}`)}>{entry.exerciseNameSnapshot}</Button>)}</Stack> : <Typography color="text.secondary">Termine une séance pour afficher les exercices.</Typography>}</CardContent></Card><Typography variant="h5" sx={{mt: 3, mb: 1}}>Historique des séances</Typography>{history.length ? <Stack spacing={1}>{history.map((session) => <Card key={session.id}><CardContent><Stack direction="row" justifyContent="space-between" gap={2}><div><Typography variant="h6">{session.nameSnapshot}</Typography><Typography color="text.secondary">{new Date(session.endedAt ?? session.startedAt).toLocaleString()}</Typography></div><Chip label={`${session.exerciseCount} ex. · ${session.setCount} séries · ${Math.round((session.elapsedSeconds ?? 0) / 60)} min`}/></Stack></CardContent></Card>)}</Stack> : <StatePanel title="Pas encore de séance terminée" description="L’historique apparaîtra ici sans dépendre des programmes modifiables." icon={<Timeline/>}/>}</ScreenContainer></Layout>;
}

export function ExerciseProgressPage() {
    const {exerciseId = ''} = useParams();
    const result = useLiveQuery(() => progress.exercise(decodeURIComponent(exerciseId)), [exerciseId]);
    if (!result) return <Layout title="Exercice" hideNav><ScreenContainer><Typography>Chargement…</Typography></ScreenContainer></Layout>;
    return <Layout title="Historique exercice" hideNav><ScreenContainer><SectionHeader eyebrow="HISTORIQUE BRUT" title="Progression de l’exercice"/><Alert severity="info">{result.textSummary} La courbe 1RM est une estimation, pas une mesure directe.</Alert><Stack direction="row" gap={1} flexWrap="wrap" sx={{my: 2}}><Chip label={`Charge record ${result.records.maxLoadKg} kg`}/><Chip label={`Répétitions record ${result.records.maxReps}`}/><Chip color="warning" label={`1RM estimé ${result.records.estimatedOneRepMaxKg} kg`}/></Stack><Card><CardContent><Typography variant="h6">Tendance du maximum estimé</Typography><SimpleLineChart values={result.estimatedMaxTrend.map((entry) => entry.valueKg)} label="Courbe du maximum estimé par date"/><Typography color="text.secondary">Résumé texte : {result.estimatedMaxTrend.map((entry) => `${entry.recordedAt} ${entry.valueKg} kg estimés`).join(' · ') || 'aucune estimation'}.</Typography></CardContent></Card><Typography variant="h5" sx={{mt: 3}}>Séries brutes</Typography>{result.rawSets.map((entry) => <Card key={entry.setId} sx={{mt: 1}}><CardContent><Typography>{new Date(entry.performedAt).toLocaleString()}</Typography><Typography color="text.secondary">{entry.loadKg} kg × {entry.reps} · volume {entry.volumeKg} kg · 1RM estimé {entry.estimatedOneRepMaxKg} kg</Typography></CardContent></Card>)}</ScreenContainer></Layout>;
}

function MeasurementDialog({open, current, onClose}: {open: boolean; current?: BodyMeasurementRecord; onClose: () => void}) {
    const [type, setType] = useState<BodyMeasurementType>(current?.type ?? 'weight');
    const [value, setValue] = useState(current?.value ?? 80);
    const [unit, setUnit] = useState(current?.unit ?? 'kg');
    const [customLabel, setCustomLabel] = useState(current?.customLabel ?? '');
    const [recordedAt, setRecordedAt] = useState(current?.recordedAt ?? new Date().toISOString().slice(0, 10));
    const save = async () => { if (current) await measurements.update(current.id, {recordedAt, value, unit, customLabel}); else await measurements.add({recordedAt, type, value, unit, customLabel, note: ''}); onClose(); };
    return <Dialog open={open} onClose={onClose} fullWidth><DialogTitle>{current ? 'Modifier la mesure' : 'Ajouter une mesure'}</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}><FormControl><InputLabel id="measurement-type">Type</InputLabel><Select labelId="measurement-type" label="Type" value={type} disabled={Boolean(current)} onChange={(event) => setType(event.target.value as BodyMeasurementType)}>{Object.entries(measurementLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl>{type === 'custom' && <TextField label="Nom personnalisé" value={customLabel} onChange={(event) => setCustomLabel(event.target.value)}/>}<TextField type="date" label="Date" InputLabelProps={{shrink: true}} value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)}/><TextField type="number" label="Valeur" value={value} onChange={(event) => setValue(Number(event.target.value))}/><TextField label="Unité" value={unit} onChange={(event) => setUnit(event.target.value)}/></Stack></DialogContent><DialogActions><Button onClick={onClose}>Annuler</Button><PrimaryButton onClick={() => void save()}>Enregistrer</PrimaryButton></DialogActions></Dialog>;
}

export function MeasurementsPage() {
    const items = useLiveQuery(() => measurements.list(), []) ?? [];
    const [dialog, setDialog] = useState(false);
    const [current, setCurrent] = useState<BodyMeasurementRecord>();
    const latestByType = [...new Map(items.map((entry) => [entry.type === 'custom' ? entry.customLabel : entry.type, entry])).values()];
    const trendKey = items[0] ? (items[0].type === 'custom' ? items[0].customLabel : items[0].type) : undefined;
    const trend = items.filter((entry) => (entry.type === 'custom' ? entry.customLabel : entry.type) === trendKey).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    return <Layout title="Mesures" hideNav><ScreenContainer><SectionHeader eyebrow="SUIVI CORPOREL" title="Mesures locales" action={<PrimaryButton onClick={() => { setCurrent(undefined); setDialog(true); }}>Ajouter</PrimaryButton>}/><Alert severity="info" sx={{mb: 2}}>Unités explicites, historique modifiable et inclus dans la sauvegarde personnelle.</Alert><Stack direction="row" gap={1} flexWrap="wrap" sx={{mb: 2}}>{latestByType.map((entry) => <Chip key={entry.id} label={`${entry.customLabel ?? measurementLabels[entry.type]} ${entry.value} ${entry.unit}`}/>)}</Stack>{trend.length > 0 && <Card sx={{mb: 2}}><CardContent><Typography variant="h6">Tendance · {trend[0].customLabel ?? measurementLabels[trend[0].type]}</Typography><SimpleLineChart values={trend.map((entry) => entry.value)} label={`Courbe ${trend[0].customLabel ?? measurementLabels[trend[0].type]}`}/><Typography color="text.secondary">Résumé texte : de {trend[0].value} à {trend.at(-1)?.value} {trend[0].unit} sur {trend.length} mesure(s).</Typography></CardContent></Card>}{items.map((entry) => <Card key={entry.id} sx={{mb: 1}}><CardContent><Stack direction="row" justifyContent="space-between"><div><Typography variant="h6">{entry.customLabel ?? measurementLabels[entry.type]}</Typography><Typography color="text.secondary">{entry.recordedAt} · {entry.value} {entry.unit}</Typography></div><Stack direction="row"><Button aria-label="Modifier" onClick={() => { setCurrent(entry); setDialog(true); }}><Edit/></Button><Button color="error" aria-label="Supprimer" onClick={() => void measurements.delete(entry.id)}><Delete/></Button></Stack></Stack></CardContent></Card>)}{!items.length && <StatePanel title="Aucune mesure" description="Ajoute poids, mensurations ou une métrique personnalisée." icon={<MonitorWeight/>}/>}<MeasurementDialog key={current?.id ?? 'new'} open={dialog} current={current} onClose={() => setDialog(false)}/></ScreenContainer></Layout>;
}

function PhotoTile({photo, selected, onSelect}: {photo: ProgressPhotoRecord; selected: boolean; onSelect: () => void}) {
    const [url, setUrl] = useState('');
    useEffect(() => { let release: () => void = () => undefined; void photos.objectUrls(photo).then((value) => { setUrl(value.thumbnailUrl); release = value.release; }); return () => release(); }, [photo]);
    return <Card sx={{width: {xs: '100%', sm: 250}}}><CardContent><Box component="img" src={url} alt={`${poseLabels[photo.pose]} ${photo.recordedAt}`} sx={{width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: photo.blurThumbnail ? 'blur(12px)' : undefined}}/><FormControlLabelCompat checked={selected} onChange={onSelect} label={`${poseLabels[photo.pose]} · ${photo.recordedAt}`}/><Typography color="text.secondary">{Math.round(photo.storedByteSize / 1024)} Ko</Typography></CardContent><CardActions><Button color="error" onClick={() => void photos.delete(photo.id)}>Supprimer</Button></CardActions></Card>;
}

function FormControlLabelCompat({checked, onChange, label}: {checked: boolean; onChange: () => void; label: string}) { return <Stack direction="row" alignItems="center"><Checkbox checked={checked} onChange={onChange} inputProps={{'aria-label': label}}/><Typography>{label}</Typography></Stack>; }

export function PhotosPage() {
    const navigate = useNavigate();
    const items = useLiveQuery(() => photos.list(), []) ?? [];
    const usage = useLiveQuery(() => photos.usageBytes(), [items.length]) ?? 0;
    const [pose, setPose] = useState<ProgressPhotoPose>('front');
    const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10));
    const [weight, setWeight] = useState('');
    const [note, setNote] = useState('');
    const [blurThumbnail, setBlurThumbnail] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const add = async (file?: File) => { if (!file) return; try { setBusy(true); setError(''); const processed = await processPhoto(file); await photos.add(processed, {recordedAt, pose, weightKg: weight ? Number(weight) : undefined, note, blurThumbnail}); setNote(''); } catch (reason) { setError(reason instanceof PhotoStorageError ? `${reason.code} · ${reason.message}` : reason instanceof Error ? reason.message : 'Photo impossible.'); } finally { setBusy(false); } };
    const comparison = items.filter((entry) => selected.includes(entry.id));
    return <Layout title="Photos" hideNav><ScreenContainer><SectionHeader eyebrow="PRIVÉ · LOCAL" title="Photos de progression" action={<Button variant="outlined" startIcon={<Backup/>} onClick={() => navigate('/backup')}>Sauvegarder</Button>}/><Alert severity="info" sx={{mb: 2}}>Aucun envoi réseau. Les fichiers sont réorientés si possible, redimensionnés, réencodés et sauvegardés avec checksum.</Alert>{error && <Alert severity="error" sx={{mb: 2}} action={<Button color="inherit" onClick={() => navigate('/backup')}>Sauvegarde</Button>}>{error}</Alert>}<Stack direction={{xs: 'column', md: 'row'}} gap={2} alignItems="center"><FormControl sx={{minWidth: 180}}><InputLabel id="photo-pose">Pose</InputLabel><Select labelId="photo-pose" label="Pose" value={pose} onChange={(event) => setPose(event.target.value as ProgressPhotoPose)}>{Object.entries(poseLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl><TextField type="date" label="Date" InputLabelProps={{shrink: true}} value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)}/><TextField type="number" label="Poids facultatif (kg)" value={weight} onChange={(event) => setWeight(event.target.value)}/><TextField label="Note facultative" value={note} onChange={(event) => setNote(event.target.value)}/></Stack><Stack direction={{xs: 'column', sm: 'row'}} gap={2} alignItems="center" sx={{mt: 2}}><FormControlLabelCompat checked={blurThumbnail} onChange={() => setBlurThumbnail((value) => !value)} label="Flouter la miniature"/><Button component="label" variant="contained" startIcon={<AddAPhoto/>} disabled={busy}>{busy ? 'Traitement…' : 'Caméra ou galerie'}<input hidden type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void add(event.target.files?.[0])}/></Button><Chip label={`Stockage photos ${Math.round(usage / 1024)} Ko`}/></Stack>{comparison.length === 2 && comparison[0].pose === comparison[1].pose && <Alert severity="success" sx={{my: 2}}>Comparaison côte à côte sélectionnée pour {poseLabels[comparison[0].pose]}.</Alert>}{comparison.length === 2 && comparison[0].pose !== comparison[1].pose && <Alert severity="warning" sx={{my: 2}}>Choisis deux photos de la même pose pour comparer.</Alert>}<Stack direction="row" flexWrap="wrap" gap={2} sx={{mt: 2}}>{items.map((photo) => <PhotoTile key={photo.id} photo={photo} selected={selected.includes(photo.id)} onSelect={() => setSelected((current) => current.includes(photo.id) ? current.filter((id) => id !== photo.id) : [...current.slice(-1), photo.id])}/>)}</Stack>{!items.length && <StatePanel title="Aucune photo locale" description="Ajoute une vue face, profil, dos ou personnalisée." icon={<PhotoLibrary/>}/>}</ScreenContainer></Layout>;
}
