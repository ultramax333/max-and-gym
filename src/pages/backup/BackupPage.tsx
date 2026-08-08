import React, {useEffect, useState} from 'react';
import {Backup, FileDownload, FileUpload, Merge, Restore} from '@mui/icons-material';
import {Alert, Button, Card, CardContent, Chip, Stack, Typography} from '@mui/material';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {buildPersonalBackup, BackupPreview, importPersonalBackup, previewPersonalBackup} from '../../backup/PersonalBackupService';
import {db} from '../../db/db';
import {useLiveQuery} from 'dexie-react-hooks';
import {restAlarmGateway} from '../../native/restAlarmGateway';
import {recordNativeMigrationDecision} from '../../native/nativeMigrationDecision';

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function BackupPage() {
    const [file, setFile] = useState<File>();
    const [preview, setPreview] = useState<BackupPreview>();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const lastBackup = useLiveQuery(() => db.appMeta.get('lastBackupAt'), []);
    const [storage, setStorage] = useState<StorageEstimate>({});
    useEffect(() => { void navigator.storage?.estimate?.().then(setStorage).catch(() => undefined); }, []);
    const exportBackup = async () => { try { setBusy(true); setError(''); const blob = await buildPersonalBackup(db); downloadBlob(blob, `max-and-gym-${new Date().toISOString().replace(/[:.]/g, '-')}.maxgym`); setMessage('Backup validated and ready to download.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create backup.'); } finally { setBusy(false); } };
    const inspect = async (next?: File) => { if (!next) return; try { setFile(next); setBusy(true); setError(''); setPreview(await previewPersonalBackup(db, next)); } catch (reason) { setPreview(undefined); setError(reason instanceof Error ? reason.message : 'Invalid archive. No data was changed.'); } finally { setBusy(false); } };
    const restore = async (mode: 'replace' | 'merge') => { if (!file) return; try { setBusy(true); setError(''); const estimate = await navigator.storage?.estimate?.(); const availableBytes = estimate?.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : undefined; await importPersonalBackup(db, file, {mode, conflictPolicy: mode === 'merge' ? 'keep-current' : 'reject', availableBytes}); if (restAlarmGateway.isNativeAndroid()) recordNativeMigrationDecision(localStorage, 'import-completed'); setMessage(mode === 'replace' ? 'Complete restore validated.' : 'Merge validated; existing values were kept for conflicts.'); setPreview(undefined); setFile(undefined); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Import stopped and rolled back.'); } finally { setBusy(false); } };
    return <Layout title="Backup" hideNav><ScreenContainer><SectionHeader eyebrow="LOCAL RECOVERY" title="Personal .maxgym backup"/><Alert severity="warning" sx={{mb: 2}}>Browser data can be cleared by you or the system. Export a complete backup regularly.</Alert><Stack direction="row" gap={1} flexWrap="wrap" sx={{mb: 2}}><Chip label={`Last backup: ${lastBackup ? new Date(lastBackup.value).toLocaleString() : 'never'}`}/><Chip label={`Storage: ${Math.round((storage.usage ?? 0) / 1024)} / ${Math.round((storage.quota ?? 0) / 1024)} KB`}/></Stack>{message && <Alert severity="success" sx={{mb: 2}}>{message}</Alert>}{error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}<Card><CardContent><Typography variant="h6">Export</Typography><Typography color="text.secondary" sx={{mb: 2}}>Versioned manifest, structured data, photos, custom images, checksums and counts.</Typography><PrimaryButton startIcon={<FileDownload/>} disabled={busy} onClick={() => void exportBackup()}>{busy ? 'Validating…' : 'Export backup'}</PrimaryButton></CardContent></Card><Card sx={{mt: 2}}><CardContent><Typography variant="h6">Import with preview</Typography><Typography color="text.secondary" sx={{mb: 2}}>The file is validated before any write. A pre-import safety copy is kept.</Typography><Button component="label" variant="outlined" startIcon={<FileUpload/>}>Choose a .maxgym file<input hidden type="file" accept=".maxgym,application/vnd.maxgym+zip,application/zip" onChange={(event) => void inspect(event.target.files?.[0])}/></Button>{preview && <Stack spacing={2} sx={{mt: 2}}><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Format ${preview.manifest.exportFormatVersion}`}/><Chip label={`${Object.values(preview.manifest.recordCounts).reduce((total, count) => total + count, 0)} records`}/><Chip label={`${preview.manifest.mediaCount} media`}/><Chip label={`${Math.round(preview.manifest.mediaBytes / 1024)} KB media`}/><Chip color={preview.conflicts.length ? 'warning' : 'success'} label={`${preview.conflicts.length} conflicts`}/></Stack><Alert severity="info">Preview only: no data has been changed yet.</Alert><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><PrimaryButton startIcon={<Restore/>} disabled={busy} onClick={() => void restore('replace')}>Replace</PrimaryButton><Button variant="outlined" startIcon={<Merge/>} disabled={busy} onClick={() => void restore('merge')}>Merge and keep current values</Button></Stack></Stack>}</CardContent></Card><Alert severity="info" icon={<Backup/>} sx={{mt: 2}}>A corrupt, future, oversized or unsafe-path import is rejected before any write.</Alert></ScreenContainer></Layout>;
}
