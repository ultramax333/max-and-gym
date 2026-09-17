import React, {useState} from 'react';
import {Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Card, CardActions, CardContent, Chip, Divider, Stack, TextField, Typography} from '@mui/material';
import {ExpandMore, History, Star, Tune} from '@mui/icons-material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate, useSearchParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {recordDiagnostic} from '../../diagnostics/service';
import {ProgressionProposalRepository} from '../../progression/ProgressionProposalRepository';
import {ProgressionProposalRecord} from '../../progression/types';
import {ProgressDashboardPage} from '../progress/ProgressPages';

const proposals = new ProgressionProposalRepository(db);
const isOpen = (proposal: ProgressionProposalRecord) => proposal.status === 'pending' || proposal.status === 'postponed';

function statusLabel(proposal: ProgressionProposalRecord): string {
    if (proposal.status === 'pending') return 'Decision needed';
    if (proposal.status === 'postponed') return 'Saved for later';
    if (proposal.status === 'rejected') return 'Previous default kept';
    if (proposal.proposedLoadKg === undefined) return 'Reviewed · no change';
    return proposal.status === 'edited' ? 'Custom default applied' : 'Default applied';
}

function recommendationExplanation(proposal: ProgressionProposalRecord): string {
    switch (proposal.reasonCode) {
        case 'SUCCESS_INCREASE': return 'You completed every working set at the top of the target repetition range and met the effort target.';
        case 'HOLD_INCOMPLETE': return 'Not every working set reached the top of the target range, so keeping the current default is the conservative option.';
        case 'DISCOMFORT_HOLD': return 'Discomfort was associated with this exercise, so no increase is suggested.';
        case 'DELOAD_REVIEW': return 'Comparable attempts were missed twice, so a lower starting load is offered for review.';
        case 'CONDITIONING_INCREASE': return 'The conditioning target was completed, so a small time increase is available for review.';
        case 'MANUAL_HOLD': return 'This exercise is set to manual progression, so no load change is suggested.';
    }
}

export function ProgressWithProposalsPage() {
    const navigate = useNavigate();
    const open = useLiveQuery(async () => (await proposals.list()).filter(isOpen).length, []) ?? 0;
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}><Button variant="contained" startIcon={<Tune/>} onClick={() => navigate('/progress/proposals')}>Next-session defaults{open > 0 ? ` (${open})` : ''}</Button></Box><ProgressDashboardPage/></>;
}

function ProposalCard({id}: {id: string}) {
    const detail = useLiveQuery(() => proposals.detail(id), [id]);
    const [editedLoad, setEditedLoad] = useState<string>();
    const [error, setError] = useState<string>();
    if (!detail) return null;
    const {proposal, programName, exerciseName, savedTargetKg, targetRepsMin, targetRepsMax, targetRir, completedSets, totalSets, lastCompleted} = detail;
    const open = isOpen(proposal);
    const proposedLoad = proposal.proposedLoadKg;
    const draft = editedLoad ?? String(proposedLoad ?? '');
    const parsedLoad = draft.trim() === '' ? NaN : Number(draft);
    const canSaveEditedLoad = Number.isFinite(parsedLoad) && parsedLoad >= 0;
    const currentDefault = savedTargetKg ?? 0;
    const targetRange = targetRepsMin !== undefined && targetRepsMax !== undefined ? `${targetRepsMin}–${targetRepsMax} reps${targetRir !== undefined ? ` · target RIR ${targetRir}` : ''}` : undefined;
    const decide = async (action: () => Promise<unknown>) => {
        try { setError(undefined); await action(); }
        catch { recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code: 'PROGRESSION_DECISION_FAILED', safeMessage: 'Next-session default decision failed.'}); setError('This choice could not be saved. Your program has not been changed.'); }
    };

    return <Card component="article" sx={{borderRadius: 3, overflow: 'hidden'}}>
        <CardContent><Stack spacing={1.75}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}><Box><Typography variant="h6" component="h2">{exerciseName}</Typography><Typography variant="caption" color="text.secondary">{programName} · {new Date(proposal.createdAt).toLocaleDateString()}</Typography></Box><Chip size="small" label={statusLabel(proposal)} color={open ? 'warning' : proposal.status === 'accepted' || proposal.status === 'edited' ? 'success' : 'default'}/></Stack>
            <Divider/>
            <Box><Typography variant="overline" color="text.secondary">WHAT YOU DID</Typography><Typography>{completedSets}/{totalSets} working sets completed{lastCompleted ? ` · last set ${lastCompleted.loadKg} kg × ${lastCompleted.repetitions}` : ''}</Typography>{targetRange && <Typography variant="body2" color="text.secondary">Program target: {targetRange}</Typography>}</Box>
            <Box sx={{p: 2, borderRadius: 2.5, bgcolor: 'rgba(200,243,107,.08)', border: '1px solid', borderColor: 'rgba(200,243,107,.22)'}}><Typography variant="overline" color="primary.main">FOR THE NEXT SAVED SESSION</Typography>{proposedLoad !== undefined ? <><Typography variant="h6">{open ? `${currentDefault} kg → ${proposedLoad} kg suggested` : proposal.status === 'rejected' ? `${currentDefault} kg kept` : `${proposedLoad} kg saved as the default`}</Typography><Typography variant="body2" color="text.secondary">{recommendationExplanation(proposal)}</Typography></> : <><Typography variant="h6">Keep the current default</Typography><Typography variant="body2" color="text.secondary">{recommendationExplanation(proposal)}</Typography></>}</Box>
            {open && proposedLoad !== undefined && <TextField type="number" label="Default load for next time (kg)" size="small" value={draft} inputProps={{min: 0, step: 'any'}} onChange={(event) => setEditedLoad(event.target.value)} helperText={`Only ${programName} will be updated. This completed workout and your history stay unchanged.`}/>}
            {!open && <Alert severity="info" variant="outlined">This decision is already recorded. It did not change the completed workout or its history.</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
        </Stack></CardContent>
        {open && <CardActions sx={{alignItems: 'stretch', flexDirection: 'column', gap: 1, px: 2, pb: 2, '& > :not(style) ~ :not(style)': {ml: 0}}}>
            {proposedLoad !== undefined ? <PrimaryButton fullWidth onClick={() => void decide(() => proposals.accept(id, parsedLoad !== proposedLoad ? parsedLoad : undefined))} disabled={!canSaveEditedLoad}>Apply {canSaveEditedLoad ? parsedLoad : proposedLoad} kg next time</PrimaryButton> : <PrimaryButton fullWidth onClick={() => void decide(() => proposals.accept(id))}>Close review · no change</PrimaryButton>}
            {proposal.status === 'pending' && <Button fullWidth onClick={() => void decide(() => proposals.postpone(id))}>Decide later</Button>}
            {proposedLoad !== undefined && <Button fullWidth color="inherit" onClick={() => void decide(() => proposals.reject(id))}>Keep {currentDefault} kg</Button>}
        </CardActions>}
    </Card>;
}

function ConceptGuide() {
    return <Card sx={{mb: 2.5}}><CardContent><Typography component="h2" variant="h6">What each feature does</Typography><Stack spacing={1.5} sx={{mt: 1.5}}>
        <Stack direction="row" gap={1.5}><History color="primary"/><Box><Typography fontWeight={750}>Workout history</Typography><Typography variant="body2" color="text.secondary">Automatically records the loads, repetitions, sets and time you actually completed.</Typography></Box></Stack>
        <Stack direction="row" gap={1.5}><Star color="primary"/><Box><Typography fontWeight={750}>Exercise rating (1–5)</Typography><Typography variant="body2" color="text.secondary">Tells the generator which exercises you prefer for that body area and training goal. It never changes a load.</Typography></Box></Stack>
        <Stack direction="row" gap={1.5}><Tune color="primary"/><Box><Typography fontWeight={750}>Next-session default</Typography><Typography variant="body2" color="text.secondary">Optionally changes the starting load saved in one program. Nothing changes until you tap Apply.</Typography></Box></Stack>
    </Stack></CardContent></Card>;
}

export function ProgressionProposalsPage() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');
    const items = useLiveQuery(() => sessionId ? proposals.listForSession(sessionId) : proposals.list(), [sessionId]);
    const open = items?.filter(isOpen) ?? [];
    const history = items?.filter((item) => !isOpen(item)) ?? [];
    return <Layout title="Next-session defaults" hideNav><ScreenContainer><SectionHeader eyebrow="PROGRAM SETTINGS" title="Defaults for next time"/>
        <Alert severity="info" sx={{mb: 2}}>Nothing here is automatic. Applying a value only changes the starting load saved in that program; it never rewrites the workout you just completed.</Alert>
        <ConceptGuide/>
        {items === undefined ? <StatePanel title="Loading next-session defaults" description="Reading your local workout history."/> : open.length ? <><Typography component="h2" variant="h6" sx={{mb: 1.5}}>Your decisions</Typography><Stack spacing={2}>{open.map((item) => <ProposalCard key={item.id} id={item.id}/>)}</Stack></> : <StatePanel title="Nothing to decide" description={sessionId ? 'This workout is saved in history, and no program default needs your decision.' : 'Finish a workout from a saved program to receive optional default-load reviews here.'}/>}
        {history.length > 0 && <Accordion sx={{mt: 3, borderRadius: '16px !important', '&:before': {display: 'none'}}}><AccordionSummary expandIcon={<ExpandMore/>}><Typography fontWeight={750}>Past decisions ({history.length})</Typography></AccordionSummary><AccordionDetails><Stack spacing={2}>{history.map((item) => <ProposalCard key={item.id} id={item.id}/>)}</Stack></AccordionDetails></Accordion>}
    </ScreenContainer></Layout>;
}
