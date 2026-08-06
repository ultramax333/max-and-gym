import {buildIdentity} from '../config/buildIdentity';
import {diagnosticsDb} from './database';
import {redactContext, redactText, safeErrorClass} from './redaction';
import {MAX_DIAGNOSTIC_AGE_MS, MAX_DIAGNOSTIC_EVENTS} from './retention';
import {DiagnosticEvent, DiagnosticLevel, DiagnosticSubsystem, ErrorCode, MigrationJournalEntry, OperationJournalEntry} from './types';

function makeId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `diag-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface RecordDiagnosticInput {
    level: DiagnosticLevel;
    subsystem: DiagnosticSubsystem;
    code: ErrorCode;
    safeMessage: string;
    route?: string;
    operationId?: string;
    entityHash?: string;
    context?: Record<string, unknown>;
}

export function createDiagnosticEvent(input: RecordDiagnosticInput): DiagnosticEvent {
    return {
        id: makeId(),
        timestamp: new Date().toISOString(),
        level: input.level,
        subsystem: input.subsystem,
        code: input.code,
        safeMessage: redactText(input.safeMessage),
        buildId: buildIdentity.buildId,
        databaseSchemaVersion: buildIdentity.databaseSchemaVersion,
        route: input.route ?? globalThis.location?.hash?.replace(/^#/, '') ?? '/',
        operationId: input.operationId,
        entityHash: input.entityHash,
        context: redactContext(input.context),
    };
}

export async function pruneDiagnosticEvents(now = Date.now()): Promise<void> {
    const oldest = new Date(now - MAX_DIAGNOSTIC_AGE_MS).toISOString();
    await diagnosticsDb.events.where('timestamp').below(oldest).delete();
    const excess = (await diagnosticsDb.events.count()) - MAX_DIAGNOSTIC_EVENTS;
    if (excess > 0) {
        const ids = await diagnosticsDb.events.orderBy('timestamp').limit(excess).primaryKeys();
        await diagnosticsDb.events.bulkDelete(ids);
    }
}

export async function storeDiagnosticEvent(event: DiagnosticEvent): Promise<void> {
    await diagnosticsDb.events.put(event);
    await pruneDiagnosticEvents();
}

export function recordDiagnostic(input: RecordDiagnosticInput): string {
    const event = createDiagnosticEvent(input);
    void storeDiagnosticEvent(event).catch(() => undefined);
    return event.id;
}

export function recordException(error: unknown, code: ErrorCode, subsystem: DiagnosticSubsystem, safeMessage: string): string {
    return recordDiagnostic({
        level: 'error', subsystem, code, safeMessage,
        context: {errorClass: safeErrorClass(error)},
    });
}

export async function listDiagnosticEvents(): Promise<DiagnosticEvent[]> {
    await pruneDiagnosticEvents();
    return diagnosticsDb.events.orderBy('timestamp').reverse().toArray();
}

export async function clearDiagnosticEvents(): Promise<void> {
    await diagnosticsDb.events.clear();
}

export async function writeOperationJournal(entry: OperationJournalEntry): Promise<void> {
    await diagnosticsDb.operations.put(entry);
}

export async function writeMigrationJournal(entry: MigrationJournalEntry): Promise<void> {
    await diagnosticsDb.migrations.put(entry);
}
