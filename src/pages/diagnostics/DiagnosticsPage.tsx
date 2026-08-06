import React, {useCallback, useContext, useEffect, useState} from 'react';
import {Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography} from '@mui/material';
import {BugReport, ContentCopy, DeleteOutline, HealthAndSafety, Refresh} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import Layout from '../../components/layout';
import {buildIdentity} from '../../config/buildIdentity';
import {DBContext} from '../../context/dbContext';
import {clearDiagnosticEvents, listDiagnosticEvents} from '../../diagnostics/service';
import {DiagnosticEvent} from '../../diagnostics/types';
import {runSelfTest, SelfTestResult} from '../../diagnostics/selfTest';
import {usePwa} from '../../pwa/PwaContext';

function IdentityRow({label, value}: {label: string; value: string | number}) {
    return <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" gap={{xs: 0, sm: 2}} sx={{minWidth: 0, py: .25}}><Typography color="text.secondary">{label}</Typography><Typography sx={{fontFamily: 'monospace', overflowWrap: 'anywhere', textAlign: {sm: 'right'}}}>{value}</Typography></Stack>;
}

export default function DiagnosticsPage() {
    const {db} = useContext(DBContext);
    const pwa = usePwa();
    const navigate = useNavigate();
    const [events, setEvents] = useState<DiagnosticEvent[]>([]);
    const [selfTest, setSelfTest] = useState<SelfTestResult>();
    const [storage, setStorage] = useState<{usage?: number; quota?: number}>({});

    const refresh = useCallback(async () => {
        setEvents(await listDiagnosticEvents());
        if (navigator.storage?.estimate) setStorage(await navigator.storage.estimate());
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);

    return <Layout title="Diagnostics" hideNav scroll>
        <Stack spacing={2} sx={{p: 2, pb: 4, maxWidth: 820, mx: 'auto'}}>
            <Alert severity="info">Les diagnostics restent sur cet appareil et excluent les notes, charges, répétitions et mesures.</Alert>
            <Card><CardContent><Typography variant="h6" gutterBottom>Identité du build</Typography>
                <IdentityRow label="Version" value={buildIdentity.appVersion}/><IdentityRow label="Git SHA" value={buildIdentity.gitSha}/>
                <IdentityRow label="Build" value={buildIdentity.buildTimestamp}/><IdentityRow label="Environnement" value={buildIdentity.environment}/>
                <IdentityRow label="Base / export" value={`${buildIdentity.databaseSchemaVersion} / ${buildIdentity.exportFormatVersion}`}/>
                <IdentityRow label="Seeds exercice / programme" value={`${buildIdentity.exerciseSeedVersion} / ${buildIdentity.programSeedVersion}`}/>
                <IdentityRow label="Générateur / cache" value={`${buildIdentity.generatorVersion} / ${buildIdentity.cacheVersion}`}/>
            </CardContent></Card>
            <Card sx={{minWidth: 0}}><CardContent><Typography variant="h6" gutterBottom>PWA et stockage</Typography>
                <IdentityRow label="Service worker" value={pwa.registered ? 'enregistré' : 'non enregistré'}/>
                <IdentityRow label="Contrôle la page" value={pwa.controlling ? 'oui' : 'non'}/>
                <IdentityRow label="Mise à jour en attente" value={pwa.updateWaiting ? 'oui' : 'non'}/>
                <IdentityRow label="Hors-ligne prêt" value={pwa.offlineReady ? 'oui' : 'non'}/>
                <IdentityRow label="Stockage" value={`${storage.usage ?? 0} / ${storage.quota ?? 0} octets`}/>
                <Button sx={{mt: 1, whiteSpace: 'normal', textAlign: 'left'}} startIcon={<Refresh/>} onClick={() => void pwa.recheck()}>Revérifier le service worker</Button>
            </CardContent></Card>
            <Card><CardContent><Typography variant="h6" gutterBottom>Auto-test non destructif</Typography>
                <Button variant="contained" startIcon={<HealthAndSafety/>} onClick={async () => setSelfTest(await runSelfTest(db))}>Lancer l’auto-test</Button>
                {selfTest && <Stack spacing={1} sx={{mt: 2}}>{selfTest.checks.map((check) => <Stack key={check.id} direction="row" gap={1} alignItems="flex-start" sx={{minWidth: 0}}><Chip size="small" label={check.level} color={check.level === 'pass' ? 'success' : check.level === 'fail' ? 'error' : 'warning'}/><Typography sx={{overflowWrap: 'anywhere'}}>{check.message}</Typography></Stack>)}</Stack>}
            </CardContent></Card>
            <Card><CardContent><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">Événements récents ({events.length})</Typography>
                <Button color="error" startIcon={<DeleteOutline/>} onClick={async () => { await clearDiagnosticEvents(); await refresh(); }}>Effacer</Button></Stack>
                <Divider sx={{my: 1}}/>{events.length === 0 && <Typography color="text.secondary">Aucun événement enregistré.</Typography>}
                <Stack spacing={1}>{events.slice(0, 20).map((event) => <Box key={event.id} sx={{p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1}}>
                    <Stack direction="row" justifyContent="space-between" gap={1}><Chip size="small" label={`${event.subsystem} · ${event.code}`} color={event.level === 'error' ? 'error' : 'default'}/><Typography variant="caption">{new Date(event.timestamp).toLocaleString()}</Typography></Stack>
                    <Typography sx={{my: .5}}>{event.safeMessage}</Typography><Stack direction="row" alignItems="center" gap={1}><Typography variant="caption" sx={{fontFamily: 'monospace'}}>{event.id}</Typography><Button size="small" startIcon={<ContentCopy/>} onClick={() => void navigator.clipboard?.writeText(event.id)}>Copier</Button></Stack>
                </Box>)}</Stack>
            </CardContent></Card>
            <Button color="warning" variant="outlined" startIcon={<BugReport/>} onClick={() => navigate('/diagnostics/error-test')}>Tester la barrière de route</Button>
        </Stack>
    </Layout>;
}

export function IntentionalRouteError(): JSX.Element {
    throw new Error('Intentional diagnostics boundary test secret=must-not-leak');
}
