import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, LinearProgress, MenuItem, Stack, TextField, Typography} from '@mui/material';
import {DeleteOutline, Edit, FileUpload, PlayArrow, VideoLibrary} from '@mui/icons-material';
import {useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {DBContext} from '../../context/dbContext';
import {recordDiagnostic} from '../../diagnostics/service';
import {LocalVideoRepository} from '../../localVideos/LocalVideoRepository';
import {AvailableLocalVideo, LocalVideoService} from '../../localVideos/LocalVideoService';
import {OpfsVideoFileStore} from '../../localVideos/videoFiles';
import {EMPTY_VIDEO_FILTERS, filterLocalVideos, LOCAL_VIDEO_BACKUP_WARNING, LocalVideo, VIDEO_AREAS, VideoArea, VideoFilters} from '../../localVideos/model';

function useVideoLibrary() {
    const {db} = useContext(DBContext);
    const service = useMemo(() => db ? new LocalVideoService(new LocalVideoRepository(db), new OpfsVideoFileStore()) : undefined, [db]);
    const [videos, setVideos] = useState<AvailableLocalVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const sequence = useRef(0);
    const active = useRef(true);
    const invalidate = useCallback(() => {sequence.current++;}, []);
    const refresh = useCallback(async () => {
        if (!service) return;
        const request = ++sequence.current;
        try {
            const next = await service.list();
            if (active.current && request === sequence.current) { setVideos(next); setError(''); }
        } catch {
            if (active.current && request === sequence.current) setError('Your video library could not be read. Existing files have not been changed.');
            recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_READ_FAILED', safeMessage: 'The private video library could not be read.'});
        } finally { if (active.current && request === sequence.current) setLoading(false); }
    }, [service]);
    useEffect(() => {
        active.current = true;
        setLoading(true);
        void refresh();
        const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
        document.addEventListener('visibilitychange', visible);
        return () => { active.current = false; invalidate(); document.removeEventListener('visibilitychange', visible); };
    }, [refresh, invalidate]);
    return {service, videos, loading, error, refresh};
}
function difficultyLabel(value: number): string {
    return value + ' / 5 — ' + ['Very easy', 'Easy', 'Moderate', 'Hard', 'Very hard'][value - 1];
}
function DifficultyField({value, label = 'Difficulty', disabled, onChange}: {value?: number; label?: string; disabled?: boolean; onChange: (value?: number) => void}) {
    return <TextField select fullWidth label={label} value={value ?? ''} disabled={disabled} onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}>
        <MenuItem value="">Not rated yet</MenuItem>{[1, 2, 3, 4, 5].map(level => <MenuItem key={level} value={level}>{difficultyLabel(level)}</MenuItem>)}
    </TextField>;
}
function durationLabel(video: LocalVideo): string {
    return video.durationSeconds === undefined ? 'Duration unknown' : Math.ceil(video.durationSeconds / 60) + ' min';
}
function safeMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.name === 'Error' ? error.message : fallback;
}

export default function LocalVideosPage() {
    const {service, videos, loading, error, refresh} = useVideoLibrary();
    const navigate = useNavigate();
    const location = useLocation();
    const [params, setParams] = useSearchParams();
    const areaValue = params.get('area');
    const area: VideoFilters['area'] = areaValue === 'unsorted' || VIDEO_AREAS.some(entry => entry.id === areaValue) ? areaValue as VideoFilters['area'] : 'all';
    const [filters, setFilters] = useState(EMPTY_VIDEO_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [notice, setNotice] = useState('');
    const [actionError, setActionError] = useState('');
    const [failedFiles, setFailedFiles] = useState<string[]>([]);
    const [progress, setProgress] = useState<{index: number; total: number; percent: number}>();
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<AvailableLocalVideo>();
    const controller = useRef<AbortController>();
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; controller.current?.abort(); };
    }, []);
    const busy = saving || Boolean(progress);
    const visibleVideos = filterLocalVideos(videos, {...filters, area});
    const setArea = (value: string) => setParams(value === 'all' ? {} : {area: value}, {replace: true});
    const importFiles = async (files: File[]) => {
        if (!service || busy || !files.length) return;
        if (files.length > 100) { setActionError('Choose up to 100 videos at a time.'); return; }
        const abort = new AbortController();
        controller.current = abort;
        setActionError(''); setNotice(''); setFailedFiles([]);
        let imported = 0;
        const failures: string[] = [];
        for (const [index, file] of files.entries()) {
            if (abort.signal.aborted) break;
            setProgress({index: index + 1, total: files.length, percent: 0});
            try {
                await service.import(file, bytes => { if (mounted.current) setProgress({index: index + 1, total: files.length, percent: Math.round(bytes / file.size * 100)}); }, abort.signal);
                imported++;
            } catch (reason) {
                if (abort.signal.aborted) break;
                failures.push(file.name + ': ' + safeMessage(reason, 'Import failed. Check the format and available storage.'));
                recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_IMPORT_FAILED', safeMessage: 'A user-selected video could not be imported.'});
            }
        }
        if (!mounted.current) return;
        setProgress(undefined); controller.current = undefined;
        setFailedFiles(failures);
        setNotice(imported + ' of ' + files.length + ' videos imported.' + (abort.signal.aborted ? ' Import stopped; completed imports were kept.' : ' New videos are in To sort.'));
        await refresh();
    };
    const changeDifficulty = async (video: LocalVideo, difficulty?: number) => {
        if (!service || busy) return;
        setSaving(true); setActionError('');
        try { await service.repository.update(video.id, {difficulty}); await refresh(); }
        catch {
            setActionError('Difficulty could not be saved. Try again.');
            recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_SAVE_FAILED', safeMessage: 'A local video difficulty could not be saved.'});
        } finally { if (mounted.current) setSaving(false); }
    };
    const remove = async () => {
        if (!service || !deleting || busy) return;
        setSaving(true); setActionError('');
        try { await service.remove(deleting.id); setDeleting(undefined); setNotice('Imported video removed. Your original file is unchanged.'); await refresh(); }
        catch {
            setActionError('The video could not be removed. Reload the library before trying again.');
            recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_DELETE_FAILED', safeMessage: 'A private video copy could not be removed.'});
        } finally { if (mounted.current) setSaving(false); }
    };
    return <Layout title="Personal videos"><ScreenContainer><Stack spacing={2}>
        <SectionHeader eyebrow="OFFLINE VIDEO LIBRARY" title="Your videos"/>
        <Typography color="text.secondary">Import a batch, sort it by body area, then rate how difficult each class feels to you.</Typography>
        <Alert severity="info">Videos stay on this device. Your .maxgym backup saves sorting and difficulty, not the video files. Keep the originals on your PC; libraries do not sync.</Alert>
        {service && !service.files.supported() && <Alert severity="warning">Private video storage is unavailable here. Use an up-to-date Chrome browser or the Android app.</Alert>}
        <Button variant="contained" component="label" startIcon={<FileUpload/>} disabled={busy || !service?.files.supported()}>
            Import videos<input aria-label="Choose local videos" hidden multiple type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.m4v,.webm,.ogv,.mov" disabled={busy} onChange={event => {const files = Array.from(event.target.files ?? []); event.target.value = ''; void importFiles(files);}}/>
        </Button>
        {progress && <Card><CardContent><Stack spacing={1}><Typography role="status">Importing video {progress.index} of {progress.total} · {progress.percent}%</Typography><LinearProgress variant="determinate" value={progress.percent} aria-label="Current video import progress"/><Button onClick={() => controller.current?.abort()}>Stop import</Button></Stack></CardContent></Card>}
        {notice && <Alert severity="success" role="status" action={<Button disabled={busy} onClick={() => setArea('unsorted')}>To sort</Button>}>{notice}</Alert>}
        {(error || actionError) && <Alert severity="error" action={error ? <Button onClick={() => void refresh()}>Retry</Button> : undefined}>{error || actionError}</Alert>}
        {failedFiles.length > 0 && <Alert severity="warning"><Typography>{failedFiles.length} files were not imported. Other videos were kept.</Typography>{failedFiles.map((failure, index) => <Typography key={index} variant="body2" sx={{overflowWrap: 'anywhere'}}>{failure}</Typography>)}</Alert>}
        <Stack direction="row" flexWrap="wrap" gap={1}><Chip label={videos.length + ' videos'}/><Chip label={videos.filter(video => !video.areas.length).length + ' to sort'}/><Chip label={Math.round(videos.reduce((sum, video) => sum + (video.available ? video.byteSize : 0), 0) / 1024 / 1024) + ' MB on this device'}/></Stack>
        <TextField fullWidth label="Search your videos" value={filters.search} onChange={event => setFilters({...filters, search: event.target.value})}/>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField select fullWidth label="Body area" value={area} onChange={event => setArea(event.target.value)}><MenuItem value="all">All areas</MenuItem><MenuItem value="unsorted">To sort</MenuItem>{VIDEO_AREAS.map(option => <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>)}</TextField>
            <Button variant="outlined" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Fewer filters' : 'More filters'}{filters.difficulty !== 'all' || filters.duration !== 'all' ? ' · active' : ''}</Button>
        </Stack>
        {showFilters && <Stack direction={{xs: 'column', sm: 'row'}} gap={2}>
            <TextField select fullWidth label="Difficulty filter" value={filters.difficulty} onChange={event => setFilters({...filters, difficulty: ['all', 'unrated'].includes(event.target.value) ? event.target.value as 'all' | 'unrated' : Number(event.target.value)})}><MenuItem value="all">All difficulties</MenuItem><MenuItem value="unrated">Not rated yet</MenuItem>{[1, 2, 3, 4, 5].map(level => <MenuItem key={level} value={level}>{difficultyLabel(level)}</MenuItem>)}</TextField>
            <TextField select fullWidth label="Video duration" value={filters.duration} onChange={event => setFilters({...filters, duration: event.target.value as VideoFilters['duration']})}><MenuItem value="all">All durations</MenuItem><MenuItem value="short">Up to 15 min</MenuItem><MenuItem value="medium">Over 15 to 30 min</MenuItem><MenuItem value="long">Over 30 min</MenuItem></TextField>
        </Stack>}
        {loading ? <Typography role="status">Loading your videos…</Typography> : visibleVideos.length ? <Stack spacing={2}>{visibleVideos.map(video => <Card key={video.id} component="article" aria-label={video.title}><CardContent><Stack spacing={1.5}>
            <Box sx={{p: 2, borderRadius: 3, bgcolor: 'rgba(200,243,107,.06)'}}><VideoLibrary color="primary"/><Typography component="h2" variant="h6" sx={{overflowWrap: 'anywhere'}}>{video.title}</Typography></Box>
            <Stack direction="row" gap={0.75} flexWrap="wrap"><Chip size="small" label={durationLabel(video)}/>{video.areas.length ? video.areas.map(value => <Chip key={value} size="small" label={VIDEO_AREAS.find(option => option.id === value)?.label}/>) : <Chip size="small" color="warning" label="To sort"/>}</Stack>
            {!video.available && <Alert severity="warning">The file is not on this device. Your body areas and difficulty are saved; open Edit details to reattach the original.</Alert>}
            <DifficultyField label={'Difficulty for ' + video.title} value={video.difficulty} disabled={busy} onChange={value => void changeDifficulty(video, value)}/>
        </Stack></CardContent><CardActions sx={{flexWrap: 'wrap', gap: 0.5, px: 2, pb: 2}}>
            <Button startIcon={<PlayArrow/>} variant="contained" disabled={busy || !video.available} onClick={() => navigate('/train/local-videos/' + video.id + location.search)}>Watch</Button>
            <Button startIcon={<Edit/>} disabled={busy} onClick={() => navigate('/train/local-videos/' + video.id + '/edit' + location.search)}>Edit details</Button>
            <Button startIcon={<DeleteOutline/>} color="error" disabled={busy} onClick={() => setDeleting(video)}>Delete</Button>
        </CardActions></Card>)}</Stack> : !error && <StatePanel title={videos.length ? 'No matching video' : 'No personal videos yet'} description={videos.length ? 'Change the area, difficulty or duration filters.' : 'Select several videos from your device. They will be copied locally and placed in To sort.'}/>}
    </Stack></ScreenContainer><Dialog open={Boolean(deleting)} onClose={() => !saving && setDeleting(undefined)}><DialogTitle>Delete this imported video?</DialogTitle><DialogContent><Typography>The imported copy, its body areas and difficulty will be removed. Your original file outside the app is not deleted.</Typography></DialogContent><DialogActions><Button disabled={saving} onClick={() => setDeleting(undefined)}>Keep video</Button><Button disabled={saving} color="error" onClick={() => void remove()}>Delete imported copy</Button></DialogActions></Dialog></Layout>;
}

export function LocalVideoDetailPage() {
    const {service, videos, loading, error, refresh} = useVideoLibrary();
    const {videoId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const video = videos.find(entry => entry.id === videoId);
    const [src, setSrc] = useState('');
    const [playError, setPlayError] = useState('');
    const [saving, setSaving] = useState(false);
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const assetId = video?.assetId;
    const byteSize = video?.byteSize;
    const mimeType = video?.mimeType;
    const mediaIdentity = useMemo(() => assetId && byteSize && mimeType ? {assetId, byteSize, mimeType} : undefined, [assetId, byteSize, mimeType]);
    useEffect(() => {
        if (!service || !mediaIdentity) return;
        let active = true;
        let objectUrl: string | undefined;
        setSrc(''); setPlayError('');
        void service.open(mediaIdentity).then(blob => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setSrc(objectUrl);
        }).catch(() => {
            if (active) setPlayError('The video file cannot be opened. Reattach the original from Edit details.');
            recordDiagnostic({level: 'warning', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_PLAYBACK_FAILED', safeMessage: 'A private video file could not be opened.'});
        });
        return () => {active = false; if (objectUrl) URL.revokeObjectURL(objectUrl);};
    }, [service, mediaIdentity]);
    useEffect(() => {
        const player = playerRef.current;
        return () => {if (player) {player.pause(); player.removeAttribute('src'); player.load();}};
    }, [src]);
    const saveDifficulty = async (difficulty?: number) => {
        if (!service || !video || saving) return;
        setSaving(true);
        try { await service.repository.update(video.id, {difficulty}); await refresh(); }
        catch {
            setPlayError('Difficulty could not be saved. Try again.');
            recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_SAVE_FAILED', safeMessage: 'A local video difficulty could not be saved.'});
        } finally {setSaving(false);}
    };
    return <Layout title="Watch video" hideNav onBack={() => navigate('/train/local-videos' + location.search)}><ScreenContainer><Stack spacing={2}>
        {loading ? <Typography role="status">Loading video…</Typography> : !video ? <StatePanel title="Video unavailable" description={error || 'Return to your library and choose another video.'}/> : <>
            <SectionHeader eyebrow="PERSONAL VIDEO" title={video.title}/>
            {(playError || error) && <Alert severity="error">{playError || error}</Alert>}
            {src && <Box component="video" ref={playerRef} key={assetId} controls playsInline preload="metadata" src={src} aria-label={video.title} sx={{width: '100%', maxHeight: '65dvh', bgcolor: 'black', borderRadius: 3}} onError={() => {
                setPlayError('Playback failed. This codec may not be supported on this device. Try a compatible MP4 or WebM file.');
                recordDiagnostic({level: 'warning', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_PLAYBACK_FAILED', safeMessage: 'A private video could not be decoded.'});
            }}/>}
            <Typography color="text.secondary">{durationLabel(video)} · Plays from this device, without Internet.</Typography>
            <DifficultyField value={video.difficulty} disabled={saving} onChange={value => void saveDifficulty(value)}/>
            <Typography variant="caption" color="text.secondary">Your own difficulty rating: 1 very easy, 5 very hard. Change it after trying the class.</Typography>
            <Button startIcon={<Edit/>} onClick={() => navigate('/train/local-videos/' + video.id + '/edit' + location.search)}>Edit details / reattach file</Button>
        </>}
        <Button onClick={() => navigate('/train/local-videos' + location.search)}>Back to video library</Button>
    </Stack></ScreenContainer></Layout>;
}

export function LocalVideoEditorPage() {
    const {service, videos, loading, error} = useVideoLibrary();
    const {videoId} = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const video = videos.find(entry => entry.id === videoId);
    const [title, setTitle] = useState('');
    const [areas, setAreas] = useState<VideoArea[]>([]);
    const [difficulty, setDifficulty] = useState<number>();
    const [minutes, setMinutes] = useState('');
    const [durationEdited, setDurationEdited] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [actionError, setActionError] = useState('');
    const [draftId, setDraftId] = useState('');
    const reattachController = useRef<AbortController>();
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => {mounted.current = false; reattachController.current?.abort();};
    }, []);
    useEffect(() => {
        if (!video || draftId === video.id) return;
        setDraftId(video.id); setTitle(video.title); setAreas(video.areas); setDifficulty(video.difficulty);
        setMinutes(video.durationSeconds === undefined ? '' : String(Math.max(0.1, Math.round(video.durationSeconds / 6) / 10)));
        setDurationEdited(false);
    }, [video, draftId]);
    const back = () => navigate('/train/local-videos' + location.search);
    const save = async () => {
        if (!service || !video || busy) return;
        setBusy(true); setActionError('');
        try {
            await service.repository.update(video.id, {title: title.trim(), areas, difficulty, ...(durationEdited ? {durationSeconds: minutes.trim() ? Number(minutes) * 60 : undefined} : {})});
            back();
        } catch (reason) {
            setActionError(safeMessage(reason, 'Video details could not be saved.'));
            recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_SAVE_FAILED', safeMessage: 'Local video details could not be saved.'});
        } finally {setBusy(false);}
    };
    const reattach = async (file?: File) => {
        if (!service || !video || !file || busy) return;
        const abort = new AbortController();
        reattachController.current = abort;
        setBusy(true); setActionError(''); setMessage('');
        try {await service.import(file, undefined, abort.signal, video.id); if (mounted.current) setMessage('File reattached. Your body areas and difficulty were preserved. Save details to keep any form edits.');}
        catch (reason) {
            if (!abort.signal.aborted) {
                if (mounted.current) setActionError(safeMessage(reason, 'The video could not be reattached.'));
                recordDiagnostic({level: 'error', subsystem: 'MEDIA', code: 'LOCAL_VIDEO_IMPORT_FAILED', safeMessage: 'A private video file could not be reattached.'});
            }
        } finally {if (mounted.current) setBusy(false); reattachController.current = undefined;}
    };
    return <Layout title="Edit video" hideNav onBack={back}><ScreenContainer><Stack spacing={2}>
        {loading || (video && draftId !== video.id) ? <Typography role="status">Loading video details…</Typography> : !video ? <StatePanel title="Video unavailable" description={error || 'Return to your library and choose another video.'}/> : <>
            <SectionHeader eyebrow="PERSONAL VIDEO" title="Sort and rate"/>
            {actionError && <Alert severity="error">{actionError}</Alert>}{message && <Alert severity="success" role="status">{message}</Alert>}
            <TextField required fullWidth label="Video title" value={title} inputProps={{maxLength: 160}} disabled={busy} onChange={event => setTitle(event.target.value)}/>
            <Typography component="h2" variant="h6">Body areas</Typography><Typography color="text.secondary">Choose one or more areas, or leave empty to keep this video in To sort.</Typography>
            <FormGroup>{VIDEO_AREAS.map(option => <FormControlLabel key={option.id} label={option.label} sx={{minHeight: 48}} control={<Checkbox disabled={busy} checked={areas.includes(option.id)} onChange={event => setAreas(event.target.checked ? [...areas, option.id] : areas.filter(area => area !== option.id))}/>}/>)}</FormGroup>
            <DifficultyField value={difficulty} disabled={busy} onChange={setDifficulty}/>
            <TextField label="Duration (minutes)" type="number" value={minutes} disabled={busy} inputProps={{min: 0.1, max: 1440, step: 0.1}} helperText="Shown to the nearest 0.1 minute. The measured duration stays unchanged unless you edit it." onChange={event => {setMinutes(event.target.value); setDurationEdited(true);}}/>
            <PrimaryButton disabled={busy || !title.trim()} onClick={() => void save()}>{busy ? 'Saving…' : 'Save video details'}</PrimaryButton>
            <Alert severity="info">{LOCAL_VIDEO_BACKUP_WARNING}</Alert>
            <Typography variant="caption" sx={{overflowWrap: 'anywhere'}}>{video.fileName} · {Math.round(video.byteSize / 1024 / 1024)} MB</Typography>
            <Button component="label" disabled={busy} startIcon={<FileUpload/>}>Reattach original video<input aria-label="Reattach video file" hidden type="file" accept="video/*,.mp4,.m4v,.webm,.ogv,.mov" disabled={busy} onChange={event => {const file = event.target.files?.[0]; event.target.value = ''; void reattach(file);}}/></Button>
        </>}
        <Button disabled={busy} onClick={back}>Back to video library</Button>
    </Stack></ScreenContainer></Layout>;
}
