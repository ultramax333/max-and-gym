import {IndexableType, Table} from 'dexie';
import {buildIdentity} from '../config/buildIdentity';
import {DexieDB} from '../db/db';
import {MediaBlobRecord} from '../progress/types';
import {CustomExerciseRecord} from '../exerciseCatalog/types';
import {ArchiveError, decodeZip, encodeZip, ZipEntry} from './zip';
import {CUSTOM_CORE_VIDEOS_META_KEY} from '../pages/core/coreVideos';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PRODUCT = 'max-and-gym';
const EXCLUDED_TABLES = new Set(['safetySnapshot']);
const MAX_PERSONAL_BACKUP_BYTES = 64 * 1024 * 1024;

export interface BackupManifest {
    product: string;
    applicationVersion: string;
    exportFormatVersion: number;
    databaseSchemaVersion: number;
    exerciseSeedVersion: string;
    programSeedVersion: string;
    generatorVersion: string;
    exportedAt: string;
    recordCounts: Record<string, number>;
    mediaCount: number;
    mediaBytes: number;
    files: Record<string, {sha256: string; bytes: number}>;
    warnings: string[];
}

interface BackupData {
    tables: Record<string, unknown[]>;
    media: Array<Omit<MediaBlobRecord, 'blob'> & {filePath: string}>;
    customImages: Array<{exerciseId: string; filePath: string; mimeType: string; byteSize: number; checksum: string}>;
}

export interface BackupPreview {
    manifest: BackupManifest;
    data: BackupData;
    entries: Map<string, Uint8Array>;
    totalBytes: number;
    conflicts: Array<{table: string; key: string}>;
}

export class BackupError extends Error {
    constructor(public readonly code: 'BACKUP_BUILD_FAILED' | 'BACKUP_ARCHIVE_TOO_LARGE' | 'BACKUP_CHECKSUM_MISMATCH' | 'IMPORT_UNSUPPORTED_VERSION' | 'IMPORT_SCHEMA_INVALID' | 'IMPORT_STORAGE_INSUFFICIENT' | 'IMPORT_TRANSACTION_ABORTED' | 'IMPORT_POSTCHECK_FAILED' | 'IMPORT_MERGE_CONFLICT', message: string) { super(message); this.name = 'BackupError'; }
}

export async function hasPortablePersonalData(db: DexieDB): Promise<boolean> {
    const personalTableNames = new Set([
        'workout', 'workoutExercise', 'exerciseSet', 'userMetric', 'plan',
        'workoutSession', 'sessionExercise', 'performedSet', 'restTimer', 'workoutOperation',
        'exercisePreference', 'customExercise', 'trainingProgram', 'programDay', 'programExercise',
        'exercisePrescription', 'progressionRule', 'progressionProposal', 'bodyMeasurement',
        'mediaBlob', 'progressPhoto',
    ]);
    const counts = await Promise.all(db.tables.filter((table) => personalTableNames.has(table.name)).map((table) => table.count()));
    return counts.some((count) => count > 0) || Boolean(await db.appMeta.get(CUSTOM_CORE_VIDEOS_META_KEY));
}

export async function backupDryRun(db: DexieDB): Promise<{tableCount: number; recordCount: number; mediaCount: number; missingMediaReferences: number}> {
    const tableCounts = await Promise.all(db.tables.filter((entry) => !EXCLUDED_TABLES.has(entry.name)).map((table) => table.count()));
    const [photos, media] = await Promise.all([db.progressPhoto.toArray(), db.mediaBlob.toArray()]);
    const mediaIds = new Set(media.map((entry) => entry.id));
    const missingMediaReferences = photos.reduce((total, photo) => total + Number(!mediaIds.has(photo.imageBlobId)) + Number(!mediaIds.has(photo.thumbnailBlobId)), 0);
    return {tableCount: tableCounts.length, recordCount: tableCounts.reduce((total, count) => total + count, 0), mediaCount: media.length, missingMediaReferences};
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
    if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error('Blob read failed'));
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.readAsArrayBuffer(blob);
    });
}

async function sha256(bytes: Uint8Array): Promise<string> {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function jsonBytes(value: unknown): Uint8Array { return encoder.encode(JSON.stringify(value)); }

function tableKey(table: Table, record: unknown): IndexableType {
    const keyPath = table.schema.primKey.keyPath;
    if (typeof keyPath !== 'string' || !record || typeof record !== 'object') throw new BackupError('IMPORT_SCHEMA_INVALID', `Unsupported primary key for ${table.name}.`);
    const value = (record as Record<string, unknown>)[keyPath];
    if (value === undefined || value === null) throw new BackupError('IMPORT_SCHEMA_INVALID', `Missing primary key for ${table.name}.`);
    return value as IndexableType;
}

async function collectData(db: DexieDB): Promise<BackupData> {
    const tables: Record<string, unknown[]> = {};
    const customImages: BackupData['customImages'] = [];
    for (const table of db.tables.filter((entry) => entry.name !== 'mediaBlob' && !EXCLUDED_TABLES.has(entry.name))) {
        const records = await table.toArray();
        if (table.name !== 'customExercise') tables[table.name] = records;
        else {
            const sanitized: unknown[] = [];
            for (const raw of records as CustomExerciseRecord[]) {
                const {customImage, ...record} = raw;
                sanitized.push(record);
                if (customImage) {
                    const bytes = await blobBytes(customImage);
                    customImages.push({exerciseId: raw.id, filePath: `media/custom-exercise/${raw.id}.bin`, mimeType: raw.customImageMimeType ?? customImage.type, byteSize: bytes.length, checksum: await sha256(bytes)});
                }
            }
            tables[table.name] = sanitized;
        }
    }
    const mediaRows = await db.mediaBlob.toArray();
    const media = mediaRows.map(({blob: _blob, ...record}) => ({...record, filePath: `media/${record.id}.bin`}));
    return {tables, media, customImages};
}

async function buildEntries(data: BackupData, exportedAt: string): Promise<{manifest: BackupManifest; entries: ZipEntry[]}> {
    const dataEntry = {path: 'data.json', bytes: jsonBytes(data)};
    const entries: ZipEntry[] = [dataEntry];
    const files: BackupManifest['files'] = {};
    files[dataEntry.path] = {sha256: await sha256(dataEntry.bytes), bytes: dataEntry.bytes.length};
    const recordCounts = Object.fromEntries(Object.entries(data.tables).map(([name, values]) => [name, values.length]));
    const manifest: BackupManifest = {product: PRODUCT, applicationVersion: buildIdentity.appVersion, exportFormatVersion: buildIdentity.exportFormatVersion, databaseSchemaVersion: buildIdentity.databaseSchemaVersion, exerciseSeedVersion: buildIdentity.exerciseSeedVersion, programSeedVersion: buildIdentity.programSeedVersion, generatorVersion: buildIdentity.generatorVersion, exportedAt, recordCounts, mediaCount: data.media.length + data.customImages.length, mediaBytes: data.media.reduce((total, entry) => total + entry.byteSize, 0) + data.customImages.reduce((total, entry) => total + entry.byteSize, 0), files, warnings: []};
    return {manifest, entries};
}

async function archiveFromDatabase(db: DexieDB, exportedAt: string): Promise<Blob> {
    const data = await collectData(db);
    const mediaRows = new Map((await db.mediaBlob.toArray()).map((entry) => [entry.id, entry]));
    const {manifest, entries} = await buildEntries(data, exportedAt);
    if (manifest.mediaBytes > MAX_PERSONAL_BACKUP_BYTES) throw new BackupError('BACKUP_ARCHIVE_TOO_LARGE', 'Backup media exceeds the safe 64 MB in-memory limit. Remove or export some progress photos first.');
    for (const media of data.media) {
        const source = mediaRows.get(media.id);
        if (!source) throw new BackupError('BACKUP_BUILD_FAILED', 'Referenced media not found.');
        const bytes = await blobBytes(source.blob);
        entries.push({path: media.filePath, bytes});
        manifest.files[media.filePath] = {sha256: await sha256(bytes), bytes: bytes.length};
    }
    const customRows = new Map((await db.customExercise.toArray()).map((entry) => [entry.id, entry]));
    for (const custom of data.customImages) {
        const blob = customRows.get(custom.exerciseId)?.customImage;
        if (!blob) throw new BackupError('BACKUP_BUILD_FAILED', 'Custom exercise image not found.');
        const bytes = await blobBytes(blob);
        entries.push({path: custom.filePath, bytes});
        manifest.files[custom.filePath] = {sha256: await sha256(bytes), bytes: bytes.length};
    }
    const manifestEntry = {path: 'manifest.json', bytes: jsonBytes(manifest)};
    const zip = encodeZip([manifestEntry, ...entries]);
    if (zip.length > MAX_PERSONAL_BACKUP_BYTES) throw new BackupError('BACKUP_ARCHIVE_TOO_LARGE', 'Backup exceeds the safe 64 MB in-memory limit.');
    await parseArchiveBytes(zip);
    return new Blob([Uint8Array.from(zip).buffer], {type: 'application/vnd.maxgym+zip'});
}

export async function buildPersonalBackup(db: DexieDB, options: {now?: Date; id?: string; recordSuccess?: boolean} = {}): Promise<Blob> {
    const now = options.now ?? new Date();
    const operationId = options.id ?? globalThis.crypto.randomUUID();
    if (options.recordSuccess !== false) await db.operationJournal.put({operationId, type: 'backup', status: 'started', startedAt: now.toISOString()});
    try {
        const archive = await archiveFromDatabase(db, now.toISOString());
        if (options.recordSuccess !== false) {
            await db.transaction('rw', [db.operationJournal, db.appMeta], async () => {
                await db.operationJournal.update(operationId, {status: 'committed', finishedAt: new Date().toISOString()});
                await db.appMeta.put({key: 'lastBackupAt', value: now.toISOString(), updatedAt: now.toISOString()});
            });
        }
        return archive;
    } catch (error) {
        if (options.recordSuccess !== false) await db.operationJournal.update(operationId, {status: 'failed', finishedAt: new Date().toISOString(), safeErrorCode: error instanceof BackupError ? error.code : 'BACKUP_BUILD_FAILED'});
        throw error;
    }
}

export async function recordPersonalBackupSuccess(db: DexieDB, options: {now?: Date; id?: string} = {}): Promise<void> {
    const now = options.now ?? new Date();
    const timestamp = now.toISOString();
    const operationId = options.id ?? globalThis.crypto.randomUUID();
    await db.transaction('rw', [db.operationJournal, db.appMeta], async () => {
        await db.operationJournal.put({operationId, type: 'backup', status: 'committed', startedAt: timestamp, finishedAt: timestamp});
        await db.appMeta.put({key: 'lastBackupAt', value: timestamp, updatedAt: timestamp});
    });
}

async function parseArchiveBytes(bytes: Uint8Array): Promise<Omit<BackupPreview, 'conflicts'>> {
    let decoded: ZipEntry[];
    try { decoded = decodeZip(bytes); }
    catch (error) { if (error instanceof ArchiveError && error.code === 'ARCHIVE_CHECKSUM_INVALID') throw new BackupError('BACKUP_CHECKSUM_MISMATCH', error.message); throw new BackupError('IMPORT_SCHEMA_INVALID', error instanceof Error ? error.message : 'Invalid archive.'); }
    const entries = new Map(decoded.map((entry) => [entry.path, entry.bytes]));
    const manifestBytes = entries.get('manifest.json');
    const dataBytes = entries.get('data.json');
    if (!manifestBytes || !dataBytes) throw new BackupError('IMPORT_SCHEMA_INVALID', 'Manifest or data is missing.');
    let manifest: BackupManifest;
    let data: BackupData;
    try { manifest = JSON.parse(decoder.decode(manifestBytes)); data = JSON.parse(decoder.decode(dataBytes)); }
    catch { throw new BackupError('IMPORT_SCHEMA_INVALID', 'Invalid archive JSON.'); }
    if (manifest.product !== PRODUCT || !Number.isInteger(manifest.exportFormatVersion)) throw new BackupError('IMPORT_SCHEMA_INVALID', 'Manifest incompatible.');
    if (manifest.exportFormatVersion > buildIdentity.exportFormatVersion || manifest.databaseSchemaVersion > buildIdentity.databaseSchemaVersion) throw new BackupError('IMPORT_UNSUPPORTED_VERSION', 'This backup comes from a future version.');
    if (!data || typeof data !== 'object' || !data.tables || !Array.isArray(data.media)) throw new BackupError('IMPORT_SCHEMA_INVALID', 'Invalid data structure.');
    data.customImages ??= [];
    for (const [path, expected] of Object.entries(manifest.files)) {
        const entry = entries.get(path);
        if (!entry || entry.length !== expected.bytes || await sha256(entry) !== expected.sha256) throw new BackupError('BACKUP_CHECKSUM_MISMATCH', `Invalid checksum for ${path}.`);
    }
    for (const media of data.media) if (!entries.has(media.filePath) || !/^media\/[a-zA-Z0-9._:-]+\.bin$/.test(media.filePath)) throw new BackupError('IMPORT_SCHEMA_INVALID', 'Invalid media reference.');
    for (const custom of data.customImages) if (!entries.has(custom.filePath) || !/^media\/custom-exercise\/[a-zA-Z0-9._:-]+\.bin$/.test(custom.filePath)) throw new BackupError('IMPORT_SCHEMA_INVALID', 'Invalid custom image.');
    return {manifest, data, entries, totalBytes: bytes.length};
}

export async function previewPersonalBackup(db: DexieDB, archive: Blob): Promise<BackupPreview> {
    if (archive.size > MAX_PERSONAL_BACKUP_BYTES) throw new BackupError('BACKUP_ARCHIVE_TOO_LARGE', 'Backup exceeds the safe 64 MB in-memory limit.');
    const parsed = await parseArchiveBytes(await blobBytes(archive));
    const tableNames = new Set(db.tables.map((entry) => entry.name));
    const conflicts: BackupPreview['conflicts'] = [];
    for (const [name, records] of Object.entries(parsed.data.tables)) {
        if (!tableNames.has(name) || !Array.isArray(records)) throw new BackupError('IMPORT_SCHEMA_INVALID', `Table inconnue : ${name}.`);
        const table = db.table(name);
        for (const record of records) {
            const key = tableKey(table, record);
            const current = await table.get(key);
            let comparableCurrent = current;
            if (name === 'customExercise' && current && typeof current === 'object') {
                const {customImage: _customImage, ...rest} = current as CustomExerciseRecord;
                void _customImage;
                comparableCurrent = rest;
            }
            if (current !== undefined && JSON.stringify(comparableCurrent) !== JSON.stringify(record)) conflicts.push({table: name, key: String(key)});
        }
    }
    for (const media of parsed.data.media) {
        const current = await db.mediaBlob.get(media.id);
        if (current && current.checksum !== media.checksum) conflicts.push({table: 'mediaBlob', key: media.id});
    }
    return {...parsed, conflicts};
}

export async function importPersonalBackup(db: DexieDB, archive: Blob, options: {mode: 'replace' | 'merge'; conflictPolicy?: 'reject' | 'keep-current' | 'use-imported'; availableBytes?: number; now?: Date; id?: string}): Promise<{preview: BackupPreview; safetySnapshotId: string}> {
    const preview = await previewPersonalBackup(db, archive);
    if (options.availableBytes !== undefined && preview.manifest.mediaBytes + preview.totalBytes > options.availableBytes) throw new BackupError('IMPORT_STORAGE_INSUFFICIENT', 'Insufficient available storage.');
    if (options.mode === 'merge' && preview.conflicts.length && (options.conflictPolicy ?? 'reject') === 'reject') throw new BackupError('IMPORT_MERGE_CONFLICT', `${preview.conflicts.length} conflict(s) to resolve.`);
    const now = options.now ?? new Date();
    const operationId = options.id ?? globalThis.crypto.randomUUID();
    const safetySnapshotId = `pre-import:${operationId}`;
    const safety = await buildPersonalBackup(db, {now, id: `safety:${operationId}`, recordSuccess: false});
    await db.safetySnapshot.put({id: safetySnapshotId, blob: safety, createdAt: now.toISOString(), reason: 'pre-import'});
    await db.operationJournal.put({operationId, type: 'import', status: 'started', startedAt: now.toISOString()});
    const writable = db.tables.filter((entry) => !EXCLUDED_TABLES.has(entry.name));
    try {
        await db.transaction('rw', writable, async () => {
            if (options.mode === 'replace') for (const table of writable) await table.clear();
            for (const [name, records] of Object.entries(preview.data.tables)) {
                const table = db.table(name);
                const hydratedRecords = name === 'customExercise' ? records.map((record) => {
                    const custom = preview.data.customImages.find((entry) => entry.exerciseId === (record as {id?: string}).id);
                    return custom ? {...record as object, customImage: new Blob([Uint8Array.from(preview.entries.get(custom.filePath)!).buffer], {type: custom.mimeType}), customImageMimeType: custom.mimeType} : record;
                }) : records;
                if (options.mode === 'replace' || options.conflictPolicy === 'use-imported') await table.bulkPut(hydratedRecords);
                else {
                    for (const record of hydratedRecords) if (await table.get(tableKey(table, record)) === undefined) await table.put(record);
                }
            }
            const mediaRecords: MediaBlobRecord[] = preview.data.media.map((record) => {
                const {filePath, ...metadata} = record;
                return {...metadata, blob: new Blob([Uint8Array.from(preview.entries.get(filePath)!).buffer], {type: metadata.mimeType})};
            });
            if (options.mode === 'replace' || options.conflictPolicy === 'use-imported') await db.mediaBlob.bulkPut(mediaRecords);
            else for (const record of mediaRecords) if (!(await db.mediaBlob.get(record.id))) await db.mediaBlob.put(record);
            const photos = await db.progressPhoto.toArray();
            for (const photo of photos) if (!(await db.mediaBlob.get(photo.imageBlobId)) || !(await db.mediaBlob.get(photo.thumbnailBlobId))) throw new BackupError('IMPORT_POSTCHECK_FAILED', 'Photo reference missing after import.');
            await db.operationJournal.put({operationId, type: 'import', status: 'committed', startedAt: now.toISOString(), finishedAt: new Date().toISOString()});
            await db.appMeta.put({key: 'lastImportAt', value: now.toISOString(), updatedAt: now.toISOString()});
        });
        return {preview, safetySnapshotId};
    } catch (error) {
        await db.operationJournal.put({operationId, type: 'import', status: 'rolled-back', startedAt: now.toISOString(), finishedAt: new Date().toISOString(), safeErrorCode: error instanceof BackupError ? error.code : 'IMPORT_TRANSACTION_ABORTED'});
        throw error instanceof BackupError ? error : new BackupError('IMPORT_TRANSACTION_ABORTED', error instanceof Error ? error.name : 'Import interrompu.');
    }
}
