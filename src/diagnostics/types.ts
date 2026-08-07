export const DIAGNOSTIC_SUBSYSTEMS = [
    'BOOT', 'ROUTER', 'DB', 'MIGRATION', 'WORKOUT', 'TIMER', 'GENERATOR',
    'MEDIA', 'BACKUP', 'IMPORT', 'PWA', 'CACHE', 'STORAGE', 'UI', 'NETWORK', 'LICENSE',
] as const;

export type DiagnosticSubsystem = typeof DIAGNOSTIC_SUBSYSTEMS[number];
export type DiagnosticLevel = 'info' | 'warning' | 'error';

export const ERROR_CODES = [
    'BOOT_UNHANDLED_ERROR', 'BOOT_DATABASE_UNAVAILABLE', 'BOOT_ACTIVE_SESSION_RECOVERY_FAILED',
    'ROUTER_UNKNOWN_ROUTE', 'ROUTER_BASE_PATH_MISMATCH', 'DB_OPEN_FAILED',
    'DB_TRANSACTION_ABORTED', 'DB_INVARIANT_VIOLATION', 'DB_WRITE_RETRY_EXHAUSTED',
    'MIGRATION_STARTED', 'MIGRATION_FAILED', 'MIGRATION_POSTCHECK_FAILED', 'MIGRATION_RECOVERY_REQUIRED',
    'WORKOUT_START_FAILED', 'WORKOUT_PAUSE_FAILED', 'WORKOUT_RESUME_FAILED',
    'WORKOUT_ACTIVE_SESSION_CONFLICT', 'WORKOUT_SET_SAVE_FAILED', 'WORKOUT_DUPLICATE_SET_BLOCKED',
    'WORKOUT_UNDO_FAILED', 'WORKOUT_FINISH_FAILED', 'WORKOUT_ABANDON_FAILED', 'WORKOUT_RECOVERY_REPAIRED', 'WORKOUT_RECOVERY_BLOCKED',
    'TIMER_STATE_INVALID', 'TIMER_OWNER_MISMATCH', 'TIMER_SIGNAL_UNAVAILABLE', 'TIMER_RECOVERED_FROM_TIMESTAMP',
    'GENERATOR_INVALID_INPUT', 'GENERATOR_NO_VALID_CANDIDATE', 'GENERATOR_CONSTRAINT_VIOLATION',
    'GENERATOR_DURATION_OUT_OF_BOUNDS', 'GENERATOR_NON_DETERMINISTIC_RESULT', 'MEDIA_DECODE_FAILED',
    'MEDIA_COMPRESSION_FAILED', 'MEDIA_REFERENCE_MISSING', 'STORAGE_PERSISTENCE_DENIED',
    'STORAGE_QUOTA_EXCEEDED', 'STORAGE_ESTIMATE_UNAVAILABLE', 'BACKUP_PREFLIGHT_FAILED',
    'BACKUP_BUILD_FAILED', 'BACKUP_CHECKSUM_MISMATCH', 'IMPORT_UNSUPPORTED_VERSION', 'IMPORT_SCHEMA_INVALID',
    'IMPORT_CHECKSUM_MISMATCH', 'IMPORT_STORAGE_INSUFFICIENT', 'IMPORT_TRANSACTION_ABORTED',
    'IMPORT_POSTCHECK_FAILED', 'PWA_REGISTRATION_FAILED', 'PWA_UPDATE_AVAILABLE', 'PWA_UPDATE_DEFERRED',
    'CACHE_VERSION_MISMATCH', 'CACHE_CLEANUP_FAILED', 'NETWORK_UNEXPECTED_ORIGIN',
    'UI_ROUTE_RENDER_FAILED', 'UI_FEATURE_BOUNDARY_FAILED', 'UI_CHART_RENDER_FAILED',
] as const;

export type ErrorCode = typeof ERROR_CODES[number];
export type SafeContextValue = string | number | boolean | null;
export type SafeContext = Record<string, SafeContextValue>;

export interface DiagnosticEvent {
    id: string;
    timestamp: string;
    level: DiagnosticLevel;
    subsystem: DiagnosticSubsystem;
    code: ErrorCode;
    safeMessage: string;
    buildId: string;
    databaseSchemaVersion: number;
    route: string;
    operationId?: string;
    entityHash?: string;
    context?: SafeContext;
    resolvedAt?: string;
}

export interface OperationJournalEntry {
    operationId: string;
    kind: string;
    status: 'started' | 'succeeded' | 'failed';
    startedAt: string;
    finishedAt?: string;
    errorCode?: ErrorCode;
}

export interface MigrationJournalEntry {
    migrationId: string;
    fromVersion: number;
    toVersion: number;
    status: 'started' | 'succeeded' | 'failed';
    startedAt: string;
    finishedAt?: string;
    errorCode?: ErrorCode;
}
