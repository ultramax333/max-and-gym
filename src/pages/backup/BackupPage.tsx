import React, {useEffect, useState} from 'react';
import {Backup, FileDownload, FileUpload, Merge, Restore} from '@mui/icons-material';
import {Alert, Button, Card, CardContent, Chip, Stack, Typography} from '@mui/material';
import Layout from '../../components/layout';
import {PrimaryButton, ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {buildPersonalBackup, BackupPreview, importPersonalBackup, previewPersonalBackup} from '../../backup/PersonalBackupService';
import {db} from '../../db/db';
import {useLiveQuery} from 'dexie-react-hooks';

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
    const exportBackup = async () => { try { setBusy(true); setError(''); const blob = await buildPersonalBackup(db); downloadBlob(blob, `max-and-gym-${new Date().toISOString().replace(/[:.]/g, '-')}.maxgym`); setMessage('Sauvegarde validée et prête au téléchargement.'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Sauvegarde impossible.'); } finally { setBusy(false); } };
    const inspect = async (next?: File) => { if (!next) return; try { setFile(next); setBusy(true); setError(''); setPreview(await previewPersonalBackup(db, next)); } catch (reason) { setPreview(undefined); setError(reason instanceof Error ? reason.message : 'Archive invalide. Aucune donnée modifiée.'); } finally { setBusy(false); } };
    const restore = async (mode: 'replace' | 'merge') => { if (!file) return; try { setBusy(true); setError(''); const estimate = await navigator.storage?.estimate?.(); const availableBytes = estimate?.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : undefined; await importPersonalBackup(db, file, {mode, conflictPolicy: mode === 'merge' ? 'keep-current' : 'reject', availableBytes}); setMessage(mode === 'replace' ? 'Restauration complète validée.' : 'Fusion validée ; les conflits existants ont été conservés.'); setPreview(undefined); setFile(undefined); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Import interrompu et annulé.'); } finally { setBusy(false); } };
    return <Layout title="Sauvegarde" hideNav><ScreenContainer><SectionHeader eyebrow="RÉCUPÉRATION LOCALE" title="Sauvegarde personnelle .maxgym"/><Alert severity="warning" sx={{mb: 2}}>Les données du navigateur peuvent être effacées par toi ou le système. Exporte régulièrement une sauvegarde complète.</Alert><Stack direction="row" gap={1} flexWrap="wrap" sx={{mb: 2}}><Chip label={`Dernière sauvegarde : ${lastBackup ? new Date(lastBackup.value).toLocaleString() : 'jamais'}`}/><Chip label={`Stockage : ${Math.round((storage.usage ?? 0) / 1024)} / ${Math.round((storage.quota ?? 0) / 1024)} Ko`}/></Stack>{message && <Alert severity="success" sx={{mb: 2}}>{message}</Alert>}{error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}<Card><CardContent><Typography variant="h6">Exporter</Typography><Typography color="text.secondary" sx={{mb: 2}}>Manifest versionné, données structurées, photos, images personnalisées, sommes de contrôle et compteurs.</Typography><PrimaryButton startIcon={<FileDownload/>} disabled={busy} onClick={() => void exportBackup()}>{busy ? 'Validation…' : 'Exporter la sauvegarde'}</PrimaryButton></CardContent></Card><Card sx={{mt: 2}}><CardContent><Typography variant="h6">Importer avec aperçu</Typography><Typography color="text.secondary" sx={{mb: 2}}>Le fichier est validé avant toute écriture. Une copie de sécurité pré-import est conservée.</Typography><Button component="label" variant="outlined" startIcon={<FileUpload/>}>Choisir un fichier .maxgym<input hidden type="file" accept=".maxgym,application/vnd.maxgym+zip,application/zip" onChange={(event) => void inspect(event.target.files?.[0])}/></Button>{preview && <Stack spacing={2} sx={{mt: 2}}><Stack direction="row" gap={1} flexWrap="wrap"><Chip label={`Format ${preview.manifest.exportFormatVersion}`}/><Chip label={`${Object.values(preview.manifest.recordCounts).reduce((total, count) => total + count, 0)} enregistrements`}/><Chip label={`${preview.manifest.mediaCount} médias`}/><Chip label={`${Math.round(preview.manifest.mediaBytes / 1024)} Ko médias`}/><Chip color={preview.conflicts.length ? 'warning' : 'success'} label={`${preview.conflicts.length} conflits`}/></Stack><Alert severity="info">Aperçu seulement : aucune donnée n’a encore été modifiée.</Alert><Stack direction={{xs: 'column', sm: 'row'}} gap={1}><PrimaryButton startIcon={<Restore/>} disabled={busy} onClick={() => void restore('replace')}>Remplacer</PrimaryButton><Button variant="outlined" startIcon={<Merge/>} disabled={busy} onClick={() => void restore('merge')}>Fusionner, conserver l’existant</Button></Stack></Stack>}</CardContent></Card><Alert severity="info" icon={<Backup/>} sx={{mt: 2}}>Un import corrompu, futur, trop volumineux ou avec chemin dangereux est rejeté avant écriture.</Alert></ScreenContainer></Layout>;
}
