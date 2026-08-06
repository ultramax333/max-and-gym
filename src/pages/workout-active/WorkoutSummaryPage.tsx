import React, {useEffect, useState} from 'react';
import {Card, CardContent, LinearProgress, Stack, Typography} from '@mui/material';
import {CheckCircle} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, StatePanel} from '../../components/ui/UiPrimitives';
import {ActiveWorkoutSnapshot} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';

export function WorkoutSummaryPage() {
    const {sessionId = ''} = useParams();
    const navigate = useNavigate();
    const service = useWorkoutService();
    const [snapshot, setSnapshot] = useState<ActiveWorkoutSnapshot>();
    useEffect(() => { void service?.get(sessionId).then(setSnapshot); }, [service, sessionId]);
    if (!snapshot) return <Layout title="Résumé" hideNav><LinearProgress/></Layout>;
    const completed = snapshot.sets.filter((entry) => entry.status === 'completed');
    const duration = snapshot.session.elapsedSeconds ?? 0;
    const volume = completed.reduce((sum, entry) => sum + (entry.actualLoadKg ?? 0) * (entry.actualReps ?? 0), 0);
    return <Layout title="Résumé de séance" hideNav hideBack><ScreenContainer><Stack spacing={2}><StatePanel title="Séance enregistrée" description="La session est terminée et conservée localement sur cet appareil." icon={<CheckCircle/>}/><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Séries</Typography><Typography variant="h4">{completed.length}/{snapshot.sets.length}</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Durée active</Typography><Typography variant="h4">{Math.floor(duration / 60)} min</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Volume</Typography><Typography variant="h4">{Math.round(volume)} kg</Typography></CardContent></Card></Stack><PrimaryButton onClick={() => navigate('/')}>Retour à l’accueil</PrimaryButton></Stack></ScreenContainer></Layout>;
}
