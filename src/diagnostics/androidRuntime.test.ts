import {describeBatteryOptimization, describeNativeAlarmCapability, describeWorkoutRecovery, scheduleAndroidDiagnosticAlarm, ANDROID_DIAGNOSTIC_ALARM_DELAY_MS, ANDROID_DIAGNOSTIC_ALARM_ID} from './androidRuntime';
import {describe, expect, it, vi} from 'vitest';

describe('Android runtime diagnostics', () => {
    it('reports only restoration state, never workout values or names', () => {
        const report = describeWorkoutRecovery({
            session: {status: 'active', nameSnapshot: 'Private workout name'},
            timer: {status: 'running', endsAt: '2026-08-08T10:01:00.000Z'},
        } as never, new Date('2026-08-08T10:00:00.000Z').getTime());

        expect(report).toEqual({
            hasActiveWorkout: true,
            session: 'An active workout can be restored after reopening the app.',
            timer: 'A running rest timer is persisted and can be restored.',
        });
        expect(JSON.stringify(report)).not.toContain('Private workout name');
    });

    it('marks elapsed deadlines for recovery instead of presenting a remaining value', () => {
        const report = describeWorkoutRecovery({
            session: {status: 'paused'},
            timer: {status: 'running', endsAt: '2026-08-08T09:59:59.999Z'},
        } as never, new Date('2026-08-08T10:00:00.000Z').getTime());

        expect(report.timer).toBe('The rest deadline has passed and will be reconciled by recovery.');
        expect(report.session).toBe('A paused workout can be restored after reopening the app.');
    });

    it('does not schedule a diagnostic alarm during an active workout', async () => {
        const gateway = {isNativeAndroid: () => true, cancel: vi.fn(), schedule: vi.fn()};
        await expect(scheduleAndroidDiagnosticAlarm(gateway, true)).resolves.toEqual({status: 'blocked-active-workout'});
        expect(gateway.cancel).not.toHaveBeenCalled();
        expect(gateway.schedule).not.toHaveBeenCalled();
    });

    it('replaces only a prior diagnostic alarm and schedules a five-second test', async () => {
        const gateway = {
            isNativeAndroid: () => true,
            cancel: vi.fn().mockResolvedValue(undefined),
            schedule: vi.fn().mockResolvedValue({scheduled: true, exactAlarmAllowed: true}),
        };
        const now = new Date('2026-08-08T10:00:00.000Z').getTime();
        await expect(scheduleAndroidDiagnosticAlarm(gateway, false, now)).resolves.toEqual({
            status: 'scheduled', exactAlarmAllowed: true, endsAt: new Date(now + ANDROID_DIAGNOSTIC_ALARM_DELAY_MS).toISOString(),
        });
        expect(gateway.cancel).toHaveBeenCalledWith(ANDROID_DIAGNOSTIC_ALARM_ID);
        expect(gateway.schedule).toHaveBeenCalledWith({
            id: ANDROID_DIAGNOSTIC_ALARM_ID,
            sessionId: 'diagnostic-only',
            endsAt: new Date(now + ANDROID_DIAGNOSTIC_ALARM_DELAY_MS).toISOString(),
        });
    });

    it('keeps browser diagnostics inert and labels unavailable native capabilities honestly', async () => {
        const gateway = {isNativeAndroid: () => false, cancel: vi.fn(), schedule: vi.fn()};
        await expect(scheduleAndroidDiagnosticAlarm(gateway, false)).resolves.toEqual({status: 'unavailable'});
        expect(describeNativeAlarmCapability(undefined)).toBe('Not running in the Android app.');
        expect(describeBatteryOptimization(false)).toBe('Unavailable outside the Android app.');
    });
});
