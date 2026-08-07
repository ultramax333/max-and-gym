import {ActiveWorkoutSnapshot, CompleteSetInput, StartWorkoutInput} from './types';

export interface WorkoutRepository {
    findActive(): Promise<ActiveWorkoutSnapshot | undefined>;
    repairPosition(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    startSample(operationId: string): Promise<ActiveWorkoutSnapshot>;
    startProgramDay(input: StartWorkoutInput, operationId: string): Promise<ActiveWorkoutSnapshot>;
    completeSet(input: CompleteSetInput): Promise<ActiveWorkoutSnapshot>;
    undoSet(sessionId: string, setId: string, operationId: string): Promise<ActiveWorkoutSnapshot>;
    pause(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    resume(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    adjustTimer(sessionId: string, seconds: number): Promise<ActiveWorkoutSnapshot>;
    pauseTimer(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    resumeTimer(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    skipTimer(sessionId: string): Promise<ActiveWorkoutSnapshot>;
    abandon(sessionId: string, operationId: string): Promise<ActiveWorkoutSnapshot>;
    finish(sessionId: string, operationId: string): Promise<ActiveWorkoutSnapshot>;
    get(sessionId: string): Promise<ActiveWorkoutSnapshot | undefined>;
}
