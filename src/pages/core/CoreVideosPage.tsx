import React, {useEffect, useState} from 'react';
import {Add, Delete, Edit, OpenInNew, Verified} from '@mui/icons-material';
import {Alert, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {CORE_VIDEOS, CoreVideo, CoreVideoDuration} from './coreVideos';
import {CoreVideoRepository, CustomCoreVideo, CustomCoreVideoInput} from './CoreVideoRepository';

const repository = new CoreVideoRepository(db);
const durations: CoreVideoDuration[] = [10, 15, 20, 25, 30];
const emptyDraft: CustomCoreVideoInput = {url: '', title: '', channel: '', durationMinutes: 10, level: 'All levels', equipment: 'No equipment', focus: 'Core'};

function VideoCard({video, onEdit, onDelete}: {video: CoreVideo; onEdit?: () => void; onDelete?: () => void}) {
    return <Card variant="outlined"><CardContent><Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography component="h2" variant="h6">{video.title}</Typography>{video.curated ? <Chip size="small" color="primary" icon={<Verified/>} label="Curated"/> : <Chip size="small" label="My video"/>}</Stack>
        <Typography color="text.secondary">{video.channel}</Typography>
        <Stack direction="row" gap={0.75} flexWrap="wrap"><Chip size="small" label={`${video.durationMinutes} min`}/><Chip size="small" label={video.level}/><Chip size="small" label={video.equipment}/></Stack>
        <Typography variant="body2">{video.focus}</Typography>
    </Stack></CardContent><CardActions sx={{flexWrap: 'wrap'}}>
        <Button component="a" href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNew/>}>Open on YouTube</Button>
        {onEdit && <Button startIcon={<Edit/>} onClick={onEdit}>Edit</Button>}
        {onDelete && <Button color="error" startIcon={<Delete/>} onClick={onDelete}>Delete</Button>}
    </CardActions></Card>;
}

function VideoEditorDialog({open, video, onClose}: {open: boolean; video?: CustomCoreVideo; onClose: () => void}) {
    const [draft, setDraft] = useState<CustomCoreVideoInput>(emptyDraft);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!open) return;
        setDraft(video ? {url: `https://www.youtube.com/watch?v=${video.youtubeId}`, title: video.title, channel: video.channel, durationMinutes: video.durationMinutes, level: video.level, equipment: video.equipment, focus: video.focus} : emptyDraft);
        setError('');
    }, [open, video]);
    const save = async () => {
        setSaving(true);
        setError('');
        try { if (video) await repository.update(video.id, draft); else await repository.create(draft); onClose(); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'The video could not be saved.'); }
        finally { setSaving(false); }
    };
    return <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm"><DialogTitle>{video ? 'Edit my video' : 'Add a YouTube video'}</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        <Alert severity="info">Only the link and your description are stored locally. YouTube is contacted only when you open the video.</Alert>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField required label="YouTube URL" value={draft.url} onChange={(event) => setDraft({...draft, url: event.target.value})} placeholder="https://www.youtube.com/watch?v=…"/>
        <TextField required label="Title" value={draft.title} onChange={(event) => setDraft({...draft, title: event.target.value})}/>
        <TextField required label="Channel or coach" value={draft.channel} onChange={(event) => setDraft({...draft, channel: event.target.value})}/>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><FormControl fullWidth><InputLabel id="custom-video-duration">Duration</InputLabel><Select labelId="custom-video-duration" label="Duration" value={draft.durationMinutes} onChange={(event) => setDraft({...draft, durationMinutes: Number(event.target.value) as CoreVideoDuration})}>{durations.map((duration) => <MenuItem key={duration} value={duration}>{duration} minutes</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel id="custom-video-level">Level</InputLabel><Select labelId="custom-video-level" label="Level" value={draft.level} onChange={(event) => setDraft({...draft, level: event.target.value})}><MenuItem value="Beginner">Beginner</MenuItem><MenuItem value="All levels">All levels</MenuItem><MenuItem value="Intermediate">Intermediate</MenuItem><MenuItem value="Advanced">Advanced</MenuItem></Select></FormControl></Stack>
        <TextField label="Equipment" value={draft.equipment} onChange={(event) => setDraft({...draft, equipment: event.target.value})}/>
        <TextField label="Focus" value={draft.focus} onChange={(event) => setDraft({...draft, focus: event.target.value})}/>
    </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button><PrimaryButton disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save video'}</PrimaryButton></DialogActions></Dialog>;
}

export default function CoreVideosPage() {
    const personal = useLiveQuery(() => repository.list(), []) ?? [];
    const [duration, setDuration] = useState<'all' | CoreVideoDuration>('all');
    const [level, setLevel] = useState('all');
    const [equipment, setEquipment] = useState<'all' | 'none' | 'uses'>('all');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<CustomCoreVideo>();
    const [deleting, setDeleting] = useState<CustomCoreVideo>();
    const [deleteError, setDeleteError] = useState('');
    const videos = [...CORE_VIDEOS, ...personal].filter((video) =>
        (duration === 'all' || video.durationMinutes === duration) &&
        (level === 'all' || video.level === level) &&
        (equipment === 'all' || (equipment === 'none' ? video.equipment.toLowerCase() === 'no equipment' : video.equipment.toLowerCase() !== 'no equipment'))
    );
    const openEditor = (video?: CustomCoreVideo) => { setEditing(video); setEditorOpen(true); };
    return <Layout title="Core videos"><ScreenContainer><Stack spacing={2}>
        <SectionHeader eyebrow="CORE" title="Professional video classes" action={<PrimaryButton startIcon={<Add/>} onClick={() => openEditor()}>Add video</PrimaryButton>}/>
        {deleteError && <Alert severity="error" onClose={() => setDeleteError('')}>{deleteError}</Alert>}
        <Alert severity="info">The library and your notes work offline. Playing a class opens YouTube and requires Internet. Videos remain the property of their creators.</Alert>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><FormControl fullWidth><InputLabel id="core-video-duration">Duration</InputLabel><Select labelId="core-video-duration" label="Duration" value={duration} onChange={(event) => setDuration(event.target.value === 'all' ? 'all' : Number(event.target.value) as CoreVideoDuration)}><MenuItem value="all">All durations</MenuItem>{durations.map((item) => <MenuItem key={item} value={item}>{item} minutes</MenuItem>)}</Select></FormControl><FormControl fullWidth><InputLabel id="core-video-level">Level</InputLabel><Select labelId="core-video-level" label="Level" value={level} onChange={(event) => setLevel(event.target.value)}><MenuItem value="all">All levels</MenuItem><MenuItem value="Beginner">Beginner</MenuItem><MenuItem value="All levels">All-level classes</MenuItem><MenuItem value="Intermediate">Intermediate</MenuItem><MenuItem value="Advanced">Advanced</MenuItem></Select></FormControl><FormControl fullWidth><InputLabel id="core-video-equipment">Equipment</InputLabel><Select labelId="core-video-equipment" label="Equipment" value={equipment} onChange={(event) => setEquipment(event.target.value as typeof equipment)}><MenuItem value="all">All equipment</MenuItem><MenuItem value="none">No equipment</MenuItem><MenuItem value="uses">Uses equipment</MenuItem></Select></FormControl></Stack>
        <Typography color="text.secondary">{videos.length} class{videos.length === 1 ? '' : 'es'} · {personal.length} added by you</Typography>
        {videos.length ? <Stack spacing={1.5}>{videos.map((video) => <VideoCard key={video.id} video={video} onEdit={!video.curated ? () => openEditor(video as CustomCoreVideo) : undefined} onDelete={!video.curated ? () => setDeleting(video as CustomCoreVideo) : undefined}/>)}</Stack> : <StatePanel title="No class matches" description="Change the duration or level filters."/>}
    </Stack></ScreenContainer><VideoEditorDialog open={editorOpen} video={editing} onClose={() => { setEditorOpen(false); setEditing(undefined); }}/><Dialog open={Boolean(deleting)} onClose={() => setDeleting(undefined)}><DialogTitle>Delete this video?</DialogTitle><DialogContent><Typography>“{deleting?.title}” will be removed from your local library. Curated classes are not affected.</Typography></DialogContent><DialogActions><Button onClick={() => setDeleting(undefined)}>Cancel</Button><Button color="error" onClick={() => { if (deleting) void repository.remove(deleting.id).then(() => setDeleting(undefined)).catch(() => { setDeleting(undefined); setDeleteError('The video could not be deleted. Your library was not changed.'); }); }}>Delete</Button></DialogActions></Dialog></Layout>;
}
