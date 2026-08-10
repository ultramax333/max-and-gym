import React, {useEffect, useState} from 'react';
import {Card, CardContent, Chip, LinearProgress, Stack, Typography} from '@mui/material';
import {CheckCircle} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SecondaryButton, StatePanel} from '../../components/ui/UiPrimitives';
import {ActiveWorkoutSnapshot} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';
import {durationTargetDelta, formatElapsedDuration} from '../../workout/elapsed';

export function WorkoutSummaryPage() {
    const {sessionId = ''} = useParams();
    const navigate = useNavigate();
    const service = useWorkoutService();
    const [snapshot, setSnapshot] = useState<ActiveWorkoutSnapshot>();
    useEffect(() => { void service?.get(sessionId).then(setSnapshot); }, [service, sessionId]);
    if (!snapshot) return <Layout title="Summary" hideNav><LinearProgress/></Layout>;
    const completed = snapshot.sets.filter((entry) => entry.status === 'completed');
    const duration = snapshot.session.elapsedSeconds ?? 0;
    const plannedDuration = snapshot.session.plannedDurationSeconds;
    const targetDelta = durationTargetDelta(duration, plannedDuration);
    const volume = completed.reduce((sum, entry) => sum + (entry.actualLoadKg ?? 0) * (entry.actualReps ?? 0), 0);
    return <Layout title="Workout summary" hideNav hideBack><ScreenContainer><Stack spacing={2}><StatePanel title="Workout saved" description="The session is complete and stored locally on this device." icon={<CheckCircle/>}/><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Sets</Typography><Typography variant="h4">{completed.length}/{snapshot.sets.length}</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Actual time</Typography><Typography variant="h4" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatElapsedDuration(duration)}</Typography>{targetDelta && <Chip sx={{mt: 1}} size="small" color={targetDelta.tone} label={targetDelta.label}/>}</CardContent></Card>{plannedDuration !== undefined && <Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Planned time</Typography><Typography variant="h4" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatElapsedDuration(plannedDuration)}</Typography></CardContent></Card>}<Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Volume</Typography><Typography variant="h4">{Math.round(volume)} kg</Typography></CardContent></Card></Stack><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><SecondaryButton onClick={() => navigate('/progress/proposals')}>View proposals</SecondaryButton><PrimaryButton onClick={() => navigate('/')}>Back to home</PrimaryButton></Stack></Stack></ScreenContainer></Layout>;
}
