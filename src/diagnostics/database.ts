import Dexie, {Table} from 'dexie';
import {DiagnosticEvent, MigrationJournalEntry, OperationJournalEntry} from './types';

interface SelfTestRecord {
    id: string;
    value: string;
}

export class DiagnosticsDatabase extends Dexie {
    events!: Table<DiagnosticEvent, string>;
    operations!: Table<OperationJournalEntry, string>;
    migrations!: Table<MigrationJournalEntry, string>;
    selfTest!: Table<SelfTestRecord, string>;

    constructor(name = 'max-and-gym-diagnostics') {
        super(name);
        this.version(1).stores({
            events: '&id, timestamp, level, subsystem, code, operationId, resolvedAt',
            operations: '&operationId, kind, status, startedAt, finishedAt',
            migrations: '&migrationId, status, startedAt, finishedAt',
            selfTest: '&id',
        });
    }
}

export const diagnosticsDb = new DiagnosticsDatabase();
