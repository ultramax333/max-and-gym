export type BodyMeasurementType = 'weight' | 'waist' | 'chest' | 'hips' | 'upper-arm' | 'thigh' | 'custom';
export type ProgressPhotoPose = 'front' | 'side-left' | 'side-right' | 'back' | 'custom';
export type MediaPurpose = 'progress-photo' | 'progress-thumbnail' | 'custom-exercise-image';

export interface BodyMeasurementRecord {
    id: string;
    recordedAt: string;
    type: BodyMeasurementType;
    customLabel?: string;
    value: number;
    unit: string;
    note: string;
    createdAt: string;
    updatedAt: string;
}

export interface MediaBlobRecord {
    id: string;
    purpose: MediaPurpose;
    blob: Blob;
    mimeType: string;
    width: number;
    height: number;
    byteSize: number;
    checksum: string;
    createdAt: string;
}

export interface ProgressPhotoRecord {
    id: string;
    recordedAt: string;
    pose: ProgressPhotoPose;
    imageBlobId: string;
    thumbnailBlobId: string;
    weightKg?: number;
    note: string;
    blurThumbnail: boolean;
    originalByteSize: number;
    storedByteSize: number;
    createdAt: string;
    updatedAt: string;
}

export interface AppMetaRecord {key: string; value: string; updatedAt: string}
export interface OperationJournalRecord {operationId: string; type: 'backup' | 'import'; status: 'started' | 'committed' | 'failed' | 'rolled-back'; startedAt: string; finishedAt?: string; safeErrorCode?: string}
export interface SafetySnapshotRecord {id: string; blob: Blob; createdAt: string; reason: 'pre-import'}
