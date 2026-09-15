import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardActions, CardContent, Chip, Stack, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {recordDiagnostic} from '../../diagnostics/service';
import {ProgressionProposalRepository} from '../../progression/ProgressionProposalRepository';
import {ProgressDashboardPage} from '../progress/ProgressPages';

const proposals = new ProgressionProposalRepository(db);

export function ProgressWithProposalsPage() {
    const navigate = useNavigate();
    const open = useLiveQuery(async () => (await proposals.list()).filter((item) => item.status === 'pending' || item.status === 'postponed').length, []) ?? 0;
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}><Button variant="contained" onClick={() => navigate('/progress/proposals')}>Suggestions ({open})</Button></Box><ProgressDashboardPage/></>;
}

function ProposalCard({id}: {id: string}) {
    const detail = useLiveQuery(() => proposals.detail(id), [id]);
    const [editedLoad, setEditedLoad] = useState<string>();
    const [error, setError] = useState<string>();
    if (!detail) return null;
    const {proposal, exerciseName, savedTargetKg, targetRepsMax, completedSets, totalSets, lastCompleted} = detail;
    const open = proposal.status === 'pending' || proposal.status === 'postponed';
    const proposedLoad = proposal.proposedLoadKg;
    const draft = editedLoad ?? String(proposedLoad ?? '');
    const parsedLoad = draft.trim() === '' ? NaN : Number(draft);
    const canSaveEditedLoad = Number.isFinite(parsedLoad) && parsedLoad >= 0;
    const decide = async (action: () => Promise<unknown>) => {
        try { setError(undefined); await action(); }
        catch { recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code: 'PROGRESSION_DECISION_FAILED', safeMessage: 'Next-session suggestion decision failed.'}); setError('This decision could not be saved. Please try again.'); }
    };

    return <Card component="article" sx={{borderRadius: 3}}><CardContent><Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Typography variant="h6" component="h2">{exerciseName}</Typography><Chip size="small" label={proposal.status === 'pending' ? 'To review' : proposal.status === 'postponed' ? 'Later' : proposal.status} color={open ? 'warning' : 'default'}/></Stack>
        <Typography variant="caption" color="text.secondary">Saved program · {new Date(proposal.createdAt).toLocaleDateString()}</Typography>
        <Typography><strong>What happened:</strong> {completedSets}/{totalSets} working sets completed{lastCompleted ? `; last logged set ${lastCompleted.loadKg} kg × ${lastCompleted.repetitions} reps` : ''}{targetRepsMax !== undefined ? ` (program target: up to ${targetRepsMax} reps)` : ''}.</Typography>
        <Typography><strong>Why this suggestion:</strong> {proposal.reason}</Typography>
        <Typography><strong>For the next saved-program session:</strong> {proposedLoad !== undefined ? open ? `Change the program's current default load from ${savedTargetKg ?? 0} kg to ${proposedLoad} kg.` : `This decision suggested ${proposedLoad} kg; the program's current default is ${savedTargetKg ?? 0} kg.` : proposal.proposedConditioningSeconds !== undefined ? `Consider ${proposal.proposedConditioningSeconds} seconds of conditioning; accepting this review does not currently change the timed prescription.` : 'Keep the current target; there is no automatic increase.'}</Typography>
        {open && proposedLoad !== undefined && <TextField type="number" label="Choose another default load (kg)" size="small" value={draft} inputProps={{min: 0, step: 'any'}} onChange={(event) => setEditedLoad(event.target.value)} helperText="Leave the suggested value, or enter a load that suits you."/>}
        {error && <Alert severity="error">{error}</Alert>}
    </Stack></CardContent>{open && <CardActions sx={{flexWrap: 'wrap', gap: 1, px: 2, pb: 2}}>
        <PrimaryButton onClick={() => void decide(() => proposals.accept(id, proposedLoad !== undefined && parsedLoad !== proposedLoad ? parsedLoad : undefined))} disabled={proposedLoad !== undefined && !canSaveEditedLoad}>{proposedLoad !== undefined ? 'Use this default' : 'Acknowledge'}</PrimaryButton>
        {proposal.status === 'pending' && <Button onClick={() => void decide(() => proposals.postpone(id))}>Decide later</Button>}
        <Button color="error" onClick={() => void decide(() => proposals.reject(id))}>Dismiss</Button>
    </CardActions>}</Card>;
}

export function ProgressionProposalsPage() {
    const items = useLiveQuery(() => proposals.list(), []);
    const open = items?.filter((item) => item.status === 'pending' || item.status === 'postponed') ?? [];
    const history = items?.filter((item) => item.status !== 'pending' && item.status !== 'postponed') ?? [];
    return <Layout title="Suggestions" hideNav><ScreenContainer><SectionHeader eyebrow="PROGRESS" title="Suggestions for next time"/>
        <Alert severity="info" sx={{mb: 2}}>These are optional proposals after a saved-program workout, based on your logged sets and that program's target. They never change a future default load until you approve one. One-off workouts record history but do not create proposals.</Alert>
        {items === undefined ? <StatePanel title="Loading suggestions" description="Reading your local workout history."/> : open.length ? <Stack spacing={2}>{open.map((item) => <ProposalCard key={item.id} id={item.id}/>)}</Stack> : <StatePanel title="Nothing to decide" description="Finish a saved-program workout with progression rules to see suggestions here."/>}
        {history.length > 0 && <Box sx={{mt: 4}}><Typography component="h2" variant="h6" sx={{mb: 2}}>Past decisions</Typography><Stack spacing={2}>{history.map((item) => <ProposalCard key={item.id} id={item.id}/>)}</Stack></Box>}
    </ScreenContainer></Layout>;
}
