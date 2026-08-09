import React, {useContext, useState} from 'react';
import {Alert, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography} from '@mui/material';
import {Download, SystemUpdate} from '@mui/icons-material';
import {DBContext} from '../context/dbContext';
import {buildIdentity} from '../config/buildIdentity';
import {recordDiagnostic, recordException} from '../diagnostics/service';
import {AndroidUpdateLauncher, androidUpdateLauncher} from './androidUpdateLauncher';
import {AndroidReleaseUpdate, AndroidUpdateService, githubReleaseUpdateService} from './GitHubReleaseUpdateService';
import {AndroidUpdateBlockReason, readAndroidUpdateBlockReason} from './updateSafety';

export interface AndroidUpdateCardProps {
    service?: AndroidUpdateService;
    launcher?: AndroidUpdateLauncher;
    readBlockReason?: typeof readAndroidUpdateBlockReason;
}

const blockCopy: Record<AndroidUpdateBlockReason, string> = {
    'active-workout': 'Finish or abandon the active workout before checking for or installing an update.',
    'critical-write': 'A local save, backup or import is still in progress. Try again when it has finished.',
};

export function AndroidUpdateCard({
    service = githubReleaseUpdateService,
    launcher = androidUpdateLauncher,
    readBlockReason = readAndroidUpdateBlockReason,
}: AndroidUpdateCardProps) {
    const {db} = useContext(DBContext);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string>();
    const [error, setError] = useState<string>();
    const [available, setAvailable] = useState<AndroidReleaseUpdate>();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const checkSafety = async (): Promise<boolean> => {
        if (!db) {
            setError('The local database is not ready.');
            return false;
        }
        const reason = await readBlockReason(db);
        if (!reason) return true;
        setError(blockCopy[reason]);
        recordDiagnostic({level: 'warning', subsystem: 'PWA', code: 'ANDROID_UPDATE_DEFERRED', safeMessage: 'Android update deferred during protected local state.', context: {reason}});
        return false;
    };

    const check = async () => {
        setBusy(true);
        setError(undefined);
        setMessage(undefined);
        setAvailable(undefined);
        try {
            if (!(await checkSafety())) return;
            const result = await service.check();
            if (result.status === 'current') {
                setMessage(`Version ${result.currentVersion} is current.`);
            } else {
                setAvailable(result.release);
                setMessage(`Version ${result.release.versionName} is available.`);
            }
        } catch (reason) {
            const errorId = recordException(reason, 'ANDROID_UPDATE_CHECK_FAILED', 'NETWORK', 'The manual Android update check failed.');
            setError(`Could not check GitHub Releases. Error ID: ${errorId}`);
        } finally {
            setBusy(false);
        }
    };

    const prepareDownload = async () => {
        setError(undefined);
        if (await checkSafety()) setConfirmOpen(true);
    };

    const downloadUpdate = async () => {
        if (!available) return;
        setConfirmOpen(false);
        setBusy(true);
        try {
            if (!(await checkSafety())) return;
            const result = await launcher.downloadAndInstall(available.downloadUrl);
            setMessage(result.status === 'permission-required'
                ? 'Allow Max & Gym to install updates, then tap Download update again.'
                : 'The update is downloading. Android will show the installation prompt when it is ready.');
        } catch (reason) {
            const errorId = recordException(reason, 'ANDROID_UPDATE_LAUNCH_FAILED', 'PWA', 'The Android update download could not be started.');
            setError(`Could not start the release download. Error ID: ${errorId}`);
        } finally {
            setBusy(false);
        }
    };

    if (!launcher.isNativeAndroid()) {
        return <Card><CardContent><Typography variant="h6">Android updates</Typography><Typography color="text.secondary">Manual APK updates are shown only inside the installed Android app.</Typography></CardContent></Card>;
    }

    return <>
        <Card>
            <CardContent>
                <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="h6">Android updates</Typography>
                        <Chip size="small" label={`Installed ${buildIdentity.appVersion} (${buildIdentity.buildNumber})`}/>
                    </Stack>
                    <Typography color="text.secondary">Checks happen only when you tap the button. The app contacts the public GitHub Releases API and downloads only after your confirmation.</Typography>
                    {message && <Alert severity={available ? 'info' : 'success'}>{message}</Alert>}
                    {error && <Alert severity="warning">{error}</Alert>}
                    {available && <Alert severity="info" icon={<SystemUpdate/>}>
                        Release {available.versionName} · Android code {available.versionCode} · {Math.ceil(available.assetSize / 1024 / 1024)} MB
                        {!available.immutable && <><br/>GitHub does not mark this release immutable; Android's signing check still applies.</>}
                    </Alert>}
                </Stack>
            </CardContent>
            <CardActions sx={{px: 2, pb: 2, flexWrap: 'wrap'}}>
                <Button variant="outlined" disabled={busy} onClick={() => void check()}>{busy ? 'Checking...' : 'Check for update'}</Button>
                {available && <Button variant="contained" startIcon={<Download/>} disabled={busy} onClick={() => void prepareDownload()}>Download update</Button>}
            </CardActions>
        </Card>
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} aria-labelledby="android-update-confirm-title">
            <DialogTitle id="android-update-confirm-title">Download Max & Gym update?</DialogTitle>
            <DialogContent>
                <Stack spacing={1.5}>
                    <Typography>The signed APK for release v{available?.versionName} will download in the background. Android will ask you to confirm the installation when it is ready.</Typography>
                    <Alert severity="warning">Do not uninstall Max & Gym. Android accepts an in-place update only when the application ID, signing certificate and version code are compatible.</Alert>
                    <Typography variant="body2" color="text.secondary">Your local workout data is not uploaded. Make a .maxgym backup before major updates.</Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={() => void downloadUpdate()}>Download update</Button>
            </DialogActions>
        </Dialog>
    </>;
}
