import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardActions, CardContent, Chip, Stack, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ProgressionProposalRepository} from '../../progression/ProgressionProposalRepository';
import {useNavigate} from 'react-router-dom';
import {ProgressDashboardPage} from '../progress/ProgressPages';

const proposals = new ProgressionProposalRepository(db);

export function ProgressWithProposalsPage() {
    const navigate = useNavigate();
    const pending = useLiveQuery(() => db.progressionProposal.where('status').equals('pending').count(), []) ?? 0;
    return <><Box sx={{position: 'fixed', zIndex: 1300, bottom: {xs: 88, md: 24}, right: {xs: 16, md: 32}}}><Button variant="contained" onClick={() => navigate('/progress/proposals')}>Proposals ({pending})</Button></Box><ProgressDashboardPage/></>;
}

function ProposalCard({id}: {id: string}) {
    const proposal = useLiveQuery(() => db.progressionProposal.get(id), [id]);
    const [editedLoad, setEditedLoad] = useState<number>();
    if (!proposal) return null;
    return <Card><CardContent><Stack spacing={1}><Stack direction="row" justifyContent="space-between"><Typography variant="h6" component="h2">{proposal.exerciseId}</Typography><Chip label={proposal.status} color={proposal.status === 'pending' ? 'warning' : 'default'}/></Stack><Typography>{proposal.reason}</Typography><Typography color="text.secondary">{proposal.proposedLoadKg !== undefined ? `Proposed load: ${proposal.proposedLoadKg} kg` : proposal.proposedConditioningSeconds !== undefined ? `Proposed duration: ${proposal.proposedConditioningSeconds} s` : 'Hold proposed'}</Typography>{proposal.status === 'pending' && proposal.proposedLoadKg !== undefined && <TextField type="number" label="Edited load (kg)" value={editedLoad ?? proposal.proposedLoadKg} onChange={(event) => setEditedLoad(Number(event.target.value))}/>}</Stack></CardContent>{proposal.status === 'pending' && <CardActions><PrimaryButton onClick={() => void proposals.accept(id)}>Accept</PrimaryButton>{proposal.proposedLoadKg !== undefined && <Button onClick={() => void proposals.accept(id, editedLoad ?? proposal.proposedLoadKg)}>Edit and accept</Button>}<Button onClick={() => void proposals.postpone(id)}>Postpone</Button><Button color="error" onClick={() => void proposals.reject(id)}>Reject</Button></CardActions>}</Card>;
}

export function ProgressionProposalsPage() {
    const items = useLiveQuery(() => proposals.list(), []) ?? [];
    return <Layout title="Proposals" hideNav><ScreenContainer><SectionHeader eyebrow="PROGRESS" title="Pending decisions"/><Alert severity="info" sx={{mb: 2}}>A proposal never changes the program before your explicit acceptance.</Alert>{items.length ? <Stack spacing={2}>{items.map((proposal) => <ProposalCard key={proposal.id} id={proposal.id}/>)}</Stack> : <StatePanel title="No proposal" description="Proposals will appear after a completed workout."/>}</ScreenContainer></Layout>;
}
