import React from 'react';
import {Card, CardActionArea, CardContent, Chip, Stack, Typography} from '@mui/material';
import {Add, Bolt, CalendarMonth, FitnessCenter, PlayArrow, Timeline} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {PrimaryButton, ScreenContainer, SectionHeader, StatePanel} from '../../components/ui/UiPrimitives';
import Layout from '../../components/layout';

function ShellCard({title, text, icon, onClick}: {title: string; text: string; icon: React.ReactNode; onClick?: () => void}) {
    return <Card><CardActionArea onClick={onClick} disabled={!onClick} sx={{minHeight: 132}}><CardContent><Stack direction="row" gap={2} alignItems="flex-start"><Chip icon={icon as React.ReactElement} label="Prêt" color="primary"/><Stack><Typography component="h2" variant="h6">{title}</Typography><Typography color="text.secondary">{text}</Typography></Stack></Stack></CardContent></CardActionArea></Card>;
}

export function HomeShellPage() {
    const navigate = useNavigate();
    return <Layout title="Accueil" hideAppBar hideBack><ScreenContainer><SectionHeader eyebrow="MAX & GYM" title="Prêt à t’entraîner"/><Stack spacing={2}>
        <ShellCard title="Construis ton premier programme" text="Choisis une structure simple pour voir ta prochaine séance ici." icon={<CalendarMonth/>} onClick={() => navigate('/programs')}/>
        <Stack direction={{xs: 'column', sm: 'row'}} gap={2}><ShellCard title="Séance libre" text="Démarre depuis l’outil d’entraînement existant." icon={<PlayArrow/>} onClick={() => navigate('/train')}/><ShellCard title="Core rapide" text="10 à 15 minutes, sans mouvement brusque." icon={<Bolt/>} onClick={() => navigate('/train')}/></Stack>
        <StatePanel title="Aucune séance planifiée" description="Crée un programme ou lance une séance libre. Tes données resteront uniquement sur cet appareil." action={<PrimaryButton startIcon={<Add/>} onClick={() => navigate('/programs')}>Créer un programme</PrimaryButton>}/>
    </Stack></ScreenContainer></Layout>;
}

export function TrainShellPage() {
    const navigate = useNavigate();
    return <Layout title="Entraînement" hideBack><ScreenContainer><SectionHeader eyebrow="ENTRAÎNEMENT" title="Choisis ta séance"/><Stack spacing={2}>
        <ShellCard title="Séance libre" text="Utilise l’éditeur et le suivi de séance existants." icon={<FitnessCenter/>} onClick={() => navigate('/workouts')}/>
        <ShellCard title="Séance planifiée" text="Disponible dès qu’un programme contient une séance." icon={<CalendarMonth/>}/>
        <ShellCard title="Warm-up et core" text="Les flux détaillés arrivent avec le moteur de séance." icon={<Bolt/>}/>
    </Stack></ScreenContainer></Layout>;
}

export function ProgramsShellPage() {
    return <Layout title="Programmes" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRAMMES" title="Ta progression, structurée"/><StatePanel title="Aucun programme actif" description="Le générateur et l’éditeur arrivent dans les prochaines étapes. Pour l’instant, tu peux créer des séances depuis Entraînement." icon={<CalendarMonth/>}/></ScreenContainer></Layout>;
}

export function ProgressShellPage() {
    return <Layout title="Progression" hideBack><ScreenContainer><SectionHeader eyebrow="PROGRESSION" title="Une vue claire de ta régularité"/><StatePanel title="Pas encore de tendance" description="Après tes premières séances, retrouve ici fréquence, durée et meilleurs repères." icon={<Timeline/>}/></ScreenContainer></Layout>;
}
