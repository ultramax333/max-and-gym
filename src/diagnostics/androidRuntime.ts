import {RestAlarmCapabilities, RestAlarmGateway} from '../native/restAlarmGateway';
import {ActiveWorkoutSnapshot} from '../workout/types';

export const ANDROID_DIAGNOSTIC_ALARM_ID = 'max-gym-diagnostic-rest-alarm-v1';
export const ANDROID_DIAGNOSTIC_ALARM_DELAY_MS = 5_000;

export interface WorkoutRecoveryDiagnostic {
    hasActiveWorkout: boolean;
    session: string;
    timer: string;
}

export type DiagnosticAlarmTestResult =
    | {status: 'scheduled'; endsAt: string; exactAlarmAllowed: boolean}
    | {status: 'blocked-active-workout'}
    | {status: 'unavailable'};

export function describeWorkoutRecovery(snapshot: ActiveWorkoutSnapshot | undefined, nowEpochMs = Date.now()): WorkoutRecoveryDiagnostic {
    if (!snapshot) return {
        hasActiveWorkout: false,
        session: 'No active or paused workout is persisted.',
        timer: 'No rest timer needs recovery.',
    };

    const session = snapshot.session.status === 'paused'
        ? 'A paused workout can be restored after reopening the app.'
        : 'An active workout can be restored after reopening the app.';
    if (!snapshot.timer) return {hasActiveWorkout: true, session, timer: 'No running or paused rest timer is persisted.'};
    if (snapshot.timer.status === 'paused') return {hasActiveWorkout: true, session, timer: 'A paused rest timer is persisted and can be resumed.'};

    const deadline = new Date(snapshot.timer.endsAt).getTime();
    if (!Number.isFinite(deadline)) return {hasActiveWorkout: true, session, timer: 'The persisted rest deadline is invalid and requires recovery.'};
    return {
        hasActiveWorkout: true,
        session,
        timer: deadline <= nowEpochMs
            ? 'The rest deadline has passed and will be reconciled by recovery.'
            : 'A running rest timer is persisted and can be restored.',
    };
}

export function describeBatteryOptimization(nativeAndroid: boolean): string {
    return nativeAndroid
        ? 'Not inspected. Max & Gym does not request a battery-optimization exemption.'
        : 'Unavailable outside the Android app.';
}

export async function scheduleAndroidDiagnosticAlarm(
    gateway: Pick<RestAlarmGateway, 'isNativeAndroid' | 'schedule' | 'cancel'>,
    hasActiveWorkout: boolean,
    nowEpochMs = Date.now(),
): Promise<DiagnosticAlarmTestResult> {
    if (!gateway.isNativeAndroid()) return {status: 'unavailable'};
    if (hasActiveWorkout) return {status: 'blocked-active-workout'};

    // A stable ID means a retry replaces only a previous diagnostic alarm. It
    // is never used by a persisted workout timer.
    await gateway.cancel(ANDROID_DIAGNOSTIC_ALARM_ID);
    const endsAt = new Date(nowEpochMs + ANDROID_DIAGNOSTIC_ALARM_DELAY_MS).toISOString();
    const result = await gateway.schedule({
        id: ANDROID_DIAGNOSTIC_ALARM_ID,
        sessionId: 'diagnostic-only',
        endsAt,
    });
    return result.scheduled ? {status: 'scheduled', endsAt, exactAlarmAllowed: result.exactAlarmAllowed} : {status: 'unavailable'};
}

export function describeNativeAlarmCapability(capabilities: RestAlarmCapabilities | undefined): string {
    if (!capabilities?.nativeAndroid) return 'Not running in the Android app.';
    return capabilities.exactAlarmAllowed ? 'Allowed' : 'Not allowed; Android may delay the test.';
}
