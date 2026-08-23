import React, {useContext, useEffect, useRef, useState} from 'react';
import {Alert, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography} from '@mui/material';
import {Download, SystemUpdate} from '@mui/icons-material';
import {DBContext} from '../context/dbContext';
import {buildIdentity} from '../config/buildIdentity';
import {recordDiagnostic, recordException} from '../diagnostics/service';
import {AndroidUpdateLauncher, AndroidUpdateStatus, androidUpdateLauncher} from './androidUpdateLauncher';
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

const idleNativeStatus: AndroidUpdateStatus = {
    phase: 'idle', downloadedBytes: 0, totalBytes: 0, staged: false, downloading: false,
};

function nativeFailureCopy(reason?: string): string {
    switch (reason) {
        case 'digest-mismatch': return 'The downloaded APK failed its SHA-256 check. Download it again.';
        case 'size-mismatch': return 'The downloaded APK size does not match the GitHub release. Download it again.';
        case 'package-mismatch': return 'The downloaded APK is not Max & Gym.';
        case 'version-mismatch': return 'The downloaded APK version does not match the selected release.';
        case 'signer-mismatch': return 'The downloaded APK was not signed with the installed Max & Gym certificate.';
        case 'install-permission-required': return 'Allow Max & Gym to install unknown apps, then tap Install update.';
        case 'installer-unavailable': return 'Android could not open the package installer. Tap Install update to retry.';
        case 'copy-failed': return 'Android downloaded the APK but could not prepare it for installation. Tap Download update to retry.';
        case 'download-insufficient-space': return 'Android does not have enough free storage for the update.';
        case 'download-storage-unavailable': return 'Android storage is temporarily unavailable. Check storage, then retry.';
        case 'download-cannot-resume': return 'Android could not resume the interrupted download. Tap Retry download.';
        default: return 'The Android update failed. Tap Download update to retry.';
    }
}

function progressCopy(status: AndroidUpdateStatus): string | undefined {
    if (status.phase === 'verifying') return 'Verifying downloaded update';
    if (status.phase === 'pending') return 'Waiting for Android to start the download';
    if (status.phase === 'downloading') return 'Downloading update';
    return undefined;
}

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
    const [downloadReady, setDownloadReady] = useState(false);
    const [nativeStatus, setNativeStatus] = useState<AndroidUpdateStatus>(idleNativeStatus);
    const lastRecordedFailure = useRef<string>();

    useEffect(() => {
        if (!launcher.isNativeAndroid()) return undefined;
        let active = true;
        let listener: {remove: () => Promise<void>} | undefined;
        const applyStatus = (status: AndroidUpdateStatus) => {
            if (!active) return;
            setNativeStatus(status);
            setDownloadReady(status.phase === 'ready' || status.staged);
            if (status.phase === 'ready') {
                setError(undefined);
                setMessage('The update is verified and ready. Tap Install update if Android did not open the installer.');
            } else if (status.phase === 'permission-required') {
                setMessage('Allow Max & Gym to install unknown apps, then continue the update.');
            } else if (status.phase === 'failed') {
                setError(nativeFailureCopy(status.reason));
                const failureFingerprint = `${status.phase}:${status.reason ?? 'unknown'}:${status.downloadedBytes}:${status.totalBytes}`;
                if (lastRecordedFailure.current !== failureFingerprint) {
                    lastRecordedFailure.current = failureFingerprint;
                    const verificationReasons = ['digest-mismatch', 'size-mismatch', 'package-mismatch', 'version-mismatch', 'signer-mismatch', 'verification-unavailable', 'verification-failed'];
                    recordDiagnostic({
                        level: 'error',
                        subsystem: 'PWA',
                        code: verificationReasons.includes(status.reason ?? '') ? 'ANDROID_UPDATE_VERIFICATION_FAILED' : 'ANDROID_UPDATE_DOWNLOAD_FAILED',
                        safeMessage: 'The native Android update did not reach an installable state.',
                        context: {
                            phase: status.phase,
                            reason: status.reason ?? 'unknown',
                            downloadedBytes: status.downloadedBytes,
                            totalBytes: status.totalBytes,
                        },
                    });
                }
            }
        };
        const reconcile = () => {
            if (!launcher.getUpdateStatus) return;
            void launcher.getUpdateStatus().then(applyStatus).catch((reason) => {
                if (!active) return;
                const errorId = recordException(reason, 'ANDROID_UPDATE_LAUNCH_FAILED', 'PWA', 'The native Android update state could not be read.');
                setError(`Could not read the Android update state. Error ID: ${errorId}`);
            });
        };
        const start = async () => {
            if (launcher.addListener) listener = await launcher.addListener(applyStatus);
            reconcile();
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') reconcile();
        };
        document.addEventListener('visibilitychange', onVisibility);
        void start();
        return () => {
            active = false;
            document.removeEventListener('visibilitychange', onVisibility);
            if (listener) void listener.remove();
        };
    }, [launcher]);

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
        setDownloadReady(false);
        setBusy(true);
        try {
            if (!(await checkSafety())) return;
            const result = await launcher.downloadAndInstall({
                url: available.downloadUrl,
                expectedSha256: available.sha256,
                expectedSize: available.assetSize,
                expectedVersionName: available.versionName,
                expectedVersionCode: available.versionCode,
            });
            setNativeStatus(result);
            setMessage(result.phase === 'permission-required'
                ? 'Allow Max & Gym to install updates, then tap Download update again.'
                : 'The update is downloading in Android. You can leave this page and return without losing progress.');
        } catch (reason) {
            const errorId = recordException(reason, 'ANDROID_UPDATE_LAUNCH_FAILED', 'PWA', 'The Android update download could not be started.');
            setError(`Could not start the release download. Error ID: ${errorId}`);
        } finally {
            setBusy(false);
        }
    };

    const installPending = async () => {
        if (!launcher.installPending) return;
        setBusy(true);
        setError(undefined);
        try {
            const result = await launcher.installPending();
            setNativeStatus(result);
            if (result.phase === 'idle') setError('No completed update is available. Tap Check for update, then Download update.');
            else if (result.phase === 'failed' || result.phase === 'permission-required') setError(nativeFailureCopy(result.reason));
            else setMessage('Android is ready to install the update.');
        } catch (reason) {
            const errorId = recordException(reason, 'ANDROID_UPDATE_INSTALL_FAILED', 'PWA', 'The staged Android update could not be opened.');
            setError(`Could not open the update installer. Error ID: ${errorId}`);
        } finally {
            setBusy(false);
        }
    };

    if (!launcher.isNativeAndroid()) {
        return <Card><CardContent><Typography variant="h6">Android updates</Typography><Typography color="text.secondary">Manual APK updates are shown only inside the installed Android app.</Typography></CardContent></Card>;
    }

    const progressLabel = progressCopy(nativeStatus);
    const progressValue = nativeStatus.percent ?? 0;
    const nativeBusy = ['pending', 'downloading', 'verifying'].includes(nativeStatus.phase);

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
                    {progressLabel && <Stack spacing={0.75} aria-live="polite">
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                            <Typography variant="body2">{progressLabel}</Typography>
                            <Typography variant="body2" sx={{fontVariantNumeric: 'tabular-nums'}}>{progressValue}%</Typography>
                        </Stack>
                        <LinearProgress variant={nativeStatus.percent === undefined ? 'indeterminate' : 'determinate'} value={progressValue}/>
                        {nativeStatus.totalBytes > 0 && <Typography variant="caption" color="text.secondary" sx={{fontVariantNumeric: 'tabular-nums'}}>
                            {Math.round(nativeStatus.downloadedBytes / 1024 / 1024)} MB of {Math.round(nativeStatus.totalBytes / 1024 / 1024)} MB
                        </Typography>}
                    </Stack>}
                    {available && <Alert severity="info" icon={<SystemUpdate/>}>
                        Release {available.versionName} · Android code {available.versionCode} · {Math.ceil(available.assetSize / 1024 / 1024)} MB
                        {!available.immutable && <><br/>GitHub does not mark this release immutable; Android's signing check still applies.</>}
                    </Alert>}
                </Stack>
            </CardContent>
            <CardActions sx={{px: 2, pb: 2, flexWrap: 'wrap'}}>
                <Button variant="outlined" disabled={busy || nativeBusy} onClick={() => void check()}>{busy ? 'Checking...' : 'Check for update'}</Button>
                {available && <Button variant="contained" startIcon={<Download/>} disabled={busy || nativeBusy} onClick={() => void prepareDownload()}>{nativeStatus.phase === 'failed' ? 'Retry download' : 'Download update'}</Button>}
                {downloadReady && <Button variant="contained" color="secondary" disabled={busy} onClick={() => void installPending()}>Install update</Button>}
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
