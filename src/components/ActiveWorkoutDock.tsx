import React, {useState} from 'react';
import {Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography} from '@mui/material';
import {Flag, PlayArrow} from '@mui/icons-material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useLocation, useNavigate} from 'react-router-dom';
import {db} from '../db/db';
import {DexieWorkoutRepository} from '../workout/DexieWorkoutRepository';
import {WorkoutApplicationService} from '../workout/WorkoutApplicationService';

const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));

export function ActiveWorkoutDock({navigationVisible}: {navigationVisible: boolean}) {
    const active = useLiveQuery(() => workout.findActive(), [], null);
    const location = useLocation();
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const visible = Boolean(active) && location.pathname !== '/workout/active';

    if (!visible || !active) return null;
    const completed = active.sets.filter((entry) => entry.status === 'completed').length;
    const finish = async () => {
        setBusy(true);
        setError('');
        try {
            await workout.finish(active.session.id);
            setConfirmOpen(false);
            navigate(`/workout/summary/${active.session.id}`);
        } catch {
            setError('The workout could not be finished. Your completed sets are still saved.');
        } finally {
            setBusy(false);
        }
    };

    return <>
        <Box aria-hidden sx={{height: {xs: 82, md: 78}, flexShrink: 0}}/>
        <Paper component="aside" aria-label="Active workout controls" elevation={8} sx={{position: 'fixed', zIndex: 1250, left: {xs: 10, md: navigationVisible ? 104 : 24}, right: {xs: 10, md: 24}, bottom: {xs: navigationVisible ? 'calc(90px + env(safe-area-inset-bottom))' : 'calc(12px + env(safe-area-inset-bottom))', md: 16}, borderRadius: '24px', borderColor: 'rgba(200,243,107,.35)', background: 'linear-gradient(135deg, rgba(32,38,25,.98), rgba(21,24,27,.98))', p: 1.25}}>
            <Stack direction="row" alignItems="center" gap={1.25}>
                <Box sx={{minWidth: 0, flex: 1}}><Typography variant="overline" color="primary.main" sx={{lineHeight: 1}}>WORKOUT IN PROGRESS</Typography><Typography fontWeight={800} noWrap>{active.session.nameSnapshot}</Typography><Typography variant="caption" color="text.secondary">{completed}/{active.sets.length} sets completed</Typography></Box>
                <Button size="small" variant="contained" startIcon={<PlayArrow/>} onClick={() => navigate('/workout/active')}>Resume</Button>
                <Button size="small" color="error" variant="outlined" aria-label="Finish active workout" onClick={() => setConfirmOpen(true)}><Flag/></Button>
            </Stack>
            {error && <Alert severity="error" sx={{mt: 1}}>{error}</Alert>}
        </Paper>
        <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)}><DialogTitle>Finish this workout?</DialogTitle><DialogContent><Typography>Completed sets will stay saved. Remaining sets will remain incomplete and the session summary will show the actual elapsed time.</Typography></DialogContent><DialogActions><Button onClick={() => setConfirmOpen(false)} disabled={busy}>Keep training</Button><Button variant="contained" color="error" startIcon={<Flag/>} onClick={() => void finish()} disabled={busy}>Finish workout</Button></DialogActions></Dialog>
    </>;
}
