import React from 'react';
import {Card, CardActionArea, CardContent, Chip, Stack, Typography} from '@mui/material';
import {Add, Bolt, CalendarMonth, FitnessCenter, PlayArrow, Timeline} from '@mui/icons-material';
import {useLiveQuery} from 'dexie-react-hooks';
import {useNavigate} from 'react-router-dom';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import Layout from '../../components/layout';
import {db} from '../../db/db';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {DexieWorkoutRepository} from '../../workout/DexieWorkoutRepository';
import {WorkoutApplicationService} from '../../workout/WorkoutApplicationService';

const programs = new ProgramRepository(db);
const workout = new WorkoutApplicationService(new DexieWorkoutRepository(db));

function ShellCard({title, text, icon, onClick}: {title: string; text: string; icon: React.ReactNode; onClick?: () => void}) {
    return <Card><CardActionArea onClick={onClick} disabled={!onClick} sx={{minHeight: 132}}><CardContent><Stack direction="row" gap={2} alignItems="flex-start"><Chip icon={icon as React.ReactElement} label="Prêt" color="primary"/><Stack><Typography component="h2" variant="h6">{title}</Typography><Typography color="text.secondary">{text}</Typography></Stack></Stack></CardContent></CardActionArea></Card>;
}

function useActiveProgram() { return useLiveQuery(() => programs.active(), []); }

async function startNextProgramDay(navigate: ReturnType<typeof useNavigate>): Promise<void> {
    const program = await programs.active();
    const day = program?.days[program.currentDayIndex % program.days.length];
    if (!program || !day?.exercises.length) { navigate('/programs'); return; }
    await workout.startProgramDay({name: `${program.name} · ${day.name}`, programId: program.id, programDayId: day.id, exercises: day.exercises.map((entry) => ({exerciseId: entry.exerciseId, exerciseName: entry.exerciseNameSnapshot, prescriptionSnapshot: `${entry.prescription.workingSets} × ${entry.prescription.repsMin}–${entry.prescription.repsMax} · repos ${entry.prescription.restSeconds} s · RIR ${entry.prescription.targetRir}`, programExerciseId: entry.id, workingSets: entry.prescription.workingSets, repsMin: entry.prescription.repsMin, repsMax: entry.prescription.repsMax, targetLoadKg: entry.prescription.loadReferenceKg, targetRir: entry.prescription.targetRir, restSeconds: entry.prescription.restSeconds, locked: entry.locked, alternativeExerciseIds: entry.alternativeExerciseIds}))});
    navigate('/workout/active');
}

export function HomeShellPage() {
    const navigate = useNavigate();
    const active = useActiveProgram();
    const next = active?.days[active.currentDayIndex % active.days.length];
    return <Layout title="Accueil" hideAppBar hideBack><ScreenContainer><SectionHeader eyebrow="MAX & GYM" title="Prêt à t’entraîner"/><Stack spacing={2}>
        {active && next ? <ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercices · objectif ${next.targetDurationMinutes} min. Démarre en un geste.`} icon={<PlayArrow/>} onClick={() => startNextProgramDay(navigate)}/> : <ShellCard title="Construis ton premier programme" text="Choisis une structure simple pour voir ta prochaine séance ici." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><ShellCard title="Séance essentielle" text="Démarre ou reprends le parcours fiable et hors ligne." icon={<PlayArrow/>} onClick={() => navigate('/workout/active')}/><ShellCard title="Core rapide" text="10 à 15 minutes, sans mouvement brusque." icon={<Bolt/>} onClick={() => navigate('/train')}/></Stack>
        {!active && (
            <StatePanel title="Aucune séance planifiée" description="Crée un programme ou lance une séance libre. Tes données resteront uniquement sur cet appareil." action={<PrimaryButton startIcon={<Add/>} onClick={() => navigate('/programs')}>Créer un programme</PrimaryButton>}/>
        )}
    </Stack></ScreenContainer></Layout>;
}

export function TrainShellPage() {
    const navigate = useNavigate();
    const active = useActiveProgram();
    const next = active?.days[active.currentDayIndex % active.days.length];
    return <Layout title="Entraînement" hideBack><ScreenContainer><SectionHeader eyebrow="ENTRAÎNEMENT" title="Choisis ta séance"/><Stack spacing={2}>
        {active && next && <ShellCard title={`${active.name} · ${next.name}`} text={`${next.exercises.length} exercices · prescription figée au démarrage.`} icon={<CalendarMonth/>} onClick={() => startNextProgramDay(navigate)}/>}
        <ShellCard title="Séance essentielle" text="Démarre ou reprends une séance locale fiable." icon={<FitnessCenter/>} onClick={() => navigate('/workout/active')}/>
        <ShellCard title="Séances historiques" text="Accède à l’éditeur et aux entraînements RepQuest existants." icon={<FitnessCenter/>} onClick={() => navigate('/workouts')}/>
        {!active && <ShellCard title="Créer une séance planifiée" text="Active un programme contenant deux ou trois journées." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>}
        <ShellCard title="Warm-up et core" text="Les flux détaillés arrivent avec le moteur de séance." icon={<Bolt/>}/>
    </Stack></ScreenContainer></Layout>;
}

export function ProgressShellPage() {
    return <Layout title="Progression" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESSION" title="Une vue claire de ta régularité"/><StatePanel title="Pas encore de tendance" description="Après tes premières séances, retrouve ici fréquence, durée et meilleurs repères." icon={<Timeline/>}/></ScreenContainer></Layout>;
}
