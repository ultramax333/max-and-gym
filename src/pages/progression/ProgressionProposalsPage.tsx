import React, {useState} from 'react';
import {Alert, Box, Button, Card, CardActions, CardContent, Chip, Stack, TextField, Typography} from '@mui/material';
import {useLiveQuery} from 'dexie-react-hooks';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import {db} from '../../db/db';
import {ProgressionProposalRepository} from '../../progression/ProgressionProposalRepository';
import {useNavigate} from 'react-router-dom';
import {ProgressShellPage} from '../shell/ShellPages';

const proposals = new ProgressionProposalRepository(db);

export function ProgressWithProposalsPage() {
    const navigate = useNavigate();
    const pending = useLiveQuery(() => db.progressionProposal.where('status').equals('pending').count(), []) ?? 0;
    return <><Box sx={{position: 'fixed', zIndex: 1200, top: {xs: 70, md: 20}, right: {xs: 16, md: 32}}}><Button variant="outlined" onClick={() => navigate('/progress/proposals')}>Propositions ({pending})</Button></Box><ProgressShellPage/></>;
}

function ProposalCard({id}: {id: string}) {
    const proposal = useLiveQuery(() => db.progressionProposal.get(id), [id]);
    const [editedLoad, setEditedLoad] = useState<number>();
    if (!proposal) return null;
    return <Card><CardContent><Stack spacing={1}><Stack direction="row" justifyContent="space-between"><Typography variant="h6" component="h2">{proposal.exerciseId}</Typography><Chip label={proposal.status} color={proposal.status === 'pending' ? 'warning' : 'default'}/></Stack><Typography>{proposal.reason}</Typography><Typography color="text.secondary">{proposal.proposedLoadKg !== undefined ? `Charge proposée : ${proposal.proposedLoadKg} kg` : proposal.proposedConditioningSeconds !== undefined ? `Durée proposée : ${proposal.proposedConditioningSeconds} s` : 'Maintien proposé'}</Typography>{proposal.status === 'pending' && proposal.proposedLoadKg !== undefined && <TextField type="number" label="Charge modifiée (kg)" value={editedLoad ?? proposal.proposedLoadKg} onChange={(event) => setEditedLoad(Number(event.target.value))}/>}</Stack></CardContent>{proposal.status === 'pending' && <CardActions><PrimaryButton onClick={() => void proposals.accept(id)}>Accepter</PrimaryButton>{proposal.proposedLoadKg !== undefined && <Button onClick={() => void proposals.accept(id, editedLoad ?? proposal.proposedLoadKg)}>Modifier et accepter</Button>}<Button onClick={() => void proposals.postpone(id)}>Reporter</Button><Button color="error" onClick={() => void proposals.reject(id)}>Rejeter</Button></CardActions>}</Card>;
}

export function ProgressionProposalsPage() {
    const items = useLiveQuery(() => proposals.list(), []) ?? [];
    return <Layout title="Propositions" hideNav><ScreenContainer><SectionHeader eyebrow="PROGRESSION" title="Décisions en attente"/><Alert severity="info" sx={{mb: 2}}>Une proposition ne modifie jamais le programme avant ton acceptation explicite.</Alert>{items.length ? <Stack spacing={2}>{items.map((proposal) => <ProposalCard key={proposal.id} id={proposal.id}/>)}</Stack> : <StatePanel title="Aucune proposition" description="Les propositions apparaîtront après une séance terminée."/>}</ScreenContainer></Layout>;
}
