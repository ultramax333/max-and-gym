import React, {useEffect, useState} from 'react';
import {Card, CardContent, Chip, LinearProgress, Stack, Typography} from '@mui/material';
import {CheckCircle} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SecondaryButton, StatePanel} from '../../components/ui/UiPrimitives';
import {ActiveWorkoutSnapshot} from '../../workout/types';
import {useWorkoutService} from '../../workout/useWorkoutService';
import {durationTargetDelta, formatElapsedDuration} from '../../workout/elapsed';
import {summarizeWorkout} from '../../workout/summary';

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
    const recap = summarizeWorkout(snapshot);
    return <Layout title="Workout summary" hideNav hideBack><ScreenContainer><Stack spacing={2}><StatePanel title="Workout saved" description="The session is complete and stored locally on this device." icon={<CheckCircle/>}/><Stack direction={{xs: 'column', sm: 'row'}} gap={2}><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Sets</Typography><Typography variant="h4">{completed.length}/{snapshot.sets.length}</Typography><Typography variant="caption" color="text.secondary">{recap.incompleteSets} left incomplete</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Exercises</Typography><Typography variant="h4">{recap.completedExercises}/{snapshot.exercises.length}</Typography></CardContent></Card><Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Actual time</Typography><Typography variant="h4" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatElapsedDuration(duration)}</Typography>{targetDelta && <Chip sx={{mt: 1}} size="small" color={targetDelta.tone} label={targetDelta.label}/>}</CardContent></Card>{plannedDuration !== undefined && <Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Planned time</Typography><Typography variant="h4" sx={{fontVariantNumeric: 'tabular-nums'}}>{formatElapsedDuration(plannedDuration)}</Typography></CardContent></Card>}<Card sx={{flex: 1}}><CardContent><Typography color="text.secondary">Volume</Typography><Typography variant="h4">{Math.round(recap.totalVolumeKg)} kg</Typography></CardContent></Card></Stack><Card><CardContent><Typography component="h2" variant="h6">Exercise recap</Typography><Stack spacing={1.25} sx={{mt: 1.5}}>{recap.exercises.map((exercise) => <Stack key={exercise.sessionExerciseId} direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={1} sx={{pb: 1.25, borderBottom: '1px solid', borderColor: 'divider'}}><div><Typography fontWeight={750}>{exercise.name}</Typography>{exercise.originalName && <Typography variant="caption" color="text.secondary">Replaced {exercise.originalName}</Typography>}<Typography variant="body2" color="text.secondary">{exercise.completedSets}/{exercise.totalSets} sets · {Math.round(exercise.volumeKg)} kg volume</Typography></div>{exercise.lastCompleted ? <Chip size="small" color="primary" variant="outlined" label={`Last ${exercise.lastCompleted.loadKg} kg × ${exercise.lastCompleted.repetitions}`}/> : <Chip size="small" variant="outlined" label="Not performed"/>}</Stack>)}</Stack><Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1.5}}>These values remain in local exercise history for the next session; no automatic load increase is applied.</Typography></CardContent></Card><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><SecondaryButton onClick={() => navigate('/progress/proposals')}>View proposals</SecondaryButton><PrimaryButton onClick={() => navigate('/')}>Back to home</PrimaryButton></Stack></Stack></ScreenContainer></Layout>;
}
