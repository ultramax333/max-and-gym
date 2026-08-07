import {recordDiagnostic, writeOperationJournal} from '../diagnostics/service';
import {ErrorCode} from '../diagnostics/types';
import {DexieWorkoutRepository, WorkoutDomainError} from './DexieWorkoutRepository';
import {ActiveWorkoutSnapshot, CompleteSetInput, StartWorkoutInput} from './types';

export const ACTIVE_WORKOUT_STORAGE_KEY = 'maxgym.activeWorkoutId';

export function hasActiveWorkoutMarker(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
    return Boolean(storage.getItem(ACTIVE_WORKOUT_STORAGE_KEY));
}

export function createOperationId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `operation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class WorkoutApplicationService {
    constructor(private readonly repository: DexieWorkoutRepository) {}

    private code(error: unknown, fallback: ErrorCode): ErrorCode {
        return error instanceof WorkoutDomainError ? error.code : fallback;
    }

    private async runCritical<T>(kind: string, operationId: string, fallback: ErrorCode, action: () => Promise<T>): Promise<T> {
        const startedAt = new Date().toISOString();
        await writeOperationJournal({operationId, kind, status: 'started', startedAt});
        try {
            const result = await action();
            await writeOperationJournal({operationId, kind, status: 'succeeded', startedAt, finishedAt: new Date().toISOString()});
            return result;
        } catch (error) {
            const code = this.code(error, fallback);
            await writeOperationJournal({operationId, kind, status: 'failed', startedAt, finishedAt: new Date().toISOString(), errorCode: code});
            recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code, safeMessage: `Workout operation failed: ${kind}.`, operationId, context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            throw error;
        }
    }

    async recover(): Promise<ActiveWorkoutSnapshot | undefined> {
        try {
            let active = await this.repository.findActive();
            if (active) {
                const previousSetId = active.session.currentSetId;
                active = await this.repository.repairPosition(active.session.id);
                if (active.session.currentSetId !== previousSetId) recordDiagnostic({level: 'info', subsystem: 'WORKOUT', code: 'WORKOUT_RECOVERY_REPAIRED', safeMessage: 'Workout recovery advanced a stale completed-set pointer.'});
            }
            if (active?.timer && !active.sets.some((entry) => entry.id === active?.timer?.performedSetId)) {
                active = await this.repository.skipTimer(active.session.id);
                recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_OWNER_MISMATCH', safeMessage: 'An invalid rest timer owner was cancelled during recovery.'});
                recordDiagnostic({level: 'info', subsystem: 'WORKOUT', code: 'WORKOUT_RECOVERY_REPAIRED', safeMessage: 'Workout recovery repaired an invalid timer reference.'});
            }
            if (active?.timer?.status === 'running' && new Date(active.timer.endsAt).getTime() <= Date.now()) {
                active = await this.repository.skipTimer(active.session.id);
                recordDiagnostic({level: 'info', subsystem: 'TIMER', code: 'TIMER_RECOVERED_FROM_TIMESTAMP', safeMessage: 'An elapsed rest timer was reconciled from its persisted timestamp.'});
            }
            if (active) localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, active.session.id);
            else localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
            return active;
        } catch (error) {
            recordDiagnostic({level: 'error', subsystem: 'WORKOUT', code: this.code(error, 'WORKOUT_RECOVERY_BLOCKED'), safeMessage: 'Active workout recovery requires attention.'});
            throw error;
        }
    }

    async start(operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        const result = await this.runCritical('workout-start', operationId, 'WORKOUT_START_FAILED', () => this.repository.startSample(operationId));
        localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, result.session.id);
        return result;
    }

    async startProgramDay(input: StartWorkoutInput, operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        const result = await this.runCritical('program-workout-start', operationId, 'WORKOUT_START_FAILED', () => this.repository.startProgramDay(input, operationId));
        localStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, result.session.id);
        return result;
    }

    async completeSet(input: Omit<CompleteSetInput, 'operationId'>, operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        const result = await this.runCritical('workout-complete-set', operationId, 'WORKOUT_SET_SAVE_FAILED', () => this.repository.completeSet({...input, operationId}));
        return this.repository.repairPosition(result.session.id);
    }

    undoSet(sessionId: string, setId: string, operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        return this.runCritical('workout-undo-set', operationId, 'WORKOUT_UNDO_FAILED', () => this.repository.undoSet(sessionId, setId, operationId));
    }

    pause(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const operationId = createOperationId();
        return this.runCritical('workout-pause', operationId, 'WORKOUT_PAUSE_FAILED', () => this.repository.pause(sessionId));
    }

    resume(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        const operationId = createOperationId();
        return this.runCritical('workout-resume', operationId, 'WORKOUT_RESUME_FAILED', () => this.repository.resume(sessionId));
    }

    private async runTimer(action: () => Promise<ActiveWorkoutSnapshot>): Promise<ActiveWorkoutSnapshot> {
        try {
            return await action();
        } catch (error) {
            recordDiagnostic({level: 'error', subsystem: 'TIMER', code: 'TIMER_STATE_INVALID', safeMessage: 'A rest timer state change failed.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            throw error;
        }
    }

    adjustTimer(sessionId: string, seconds: number): Promise<ActiveWorkoutSnapshot> {
        return this.runTimer(() => this.repository.adjustTimer(sessionId, seconds));
    }

    pauseTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        return this.runTimer(() => this.repository.pauseTimer(sessionId));
    }

    resumeTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        return this.runTimer(() => this.repository.resumeTimer(sessionId));
    }

    skipTimer(sessionId: string): Promise<ActiveWorkoutSnapshot> {
        return this.runTimer(() => this.repository.skipTimer(sessionId));
    }

    async finish(sessionId: string, operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        const result = await this.runCritical('workout-finish', operationId, 'WORKOUT_FINISH_FAILED', () => this.repository.finish(sessionId, operationId));
        localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
        return result;
    }

    async abandon(sessionId: string, operationId = createOperationId()): Promise<ActiveWorkoutSnapshot> {
        const result = await this.runCritical('workout-abandon', operationId, 'WORKOUT_ABANDON_FAILED', () => this.repository.abandon(sessionId, operationId));
        localStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
        return result;
    }

    get(sessionId: string): Promise<ActiveWorkoutSnapshot | undefined> {
        return this.repository.get(sessionId);
    }
}
