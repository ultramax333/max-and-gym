import {normalizeRestAlarmPreferences, syncNativeRestAlarm} from './restAlarmGateway';
import {RestTimerRecord} from '../workout/types';
import {describe, expect, it, vi} from 'vitest';

const timer = (status: RestTimerRecord['status'], endsAt: string): RestTimerRecord => ({
    id: 'timer-1', sessionId: 'session-1', performedSetId: 'set-1', startedAt: '2026-08-07T10:00:00.000Z',
    endsAt, status, createdAt: '2026-08-07T10:00:00.000Z', updatedAt: '2026-08-07T10:00:00.000Z',
});

describe('native rest alarm synchronization', () => {
    const preferenceMethods = {getPreferences: vi.fn(), setPreferences: vi.fn()};

    it('normalizes persisted alarm preferences to supported local values', () => {
        expect(normalizeRestAlarmPreferences({durationSeconds: 20, vibrationEnabled: false, tone: 'urgent'})).toEqual({durationSeconds: 20, vibrationEnabled: false, tone: 'urgent'});
        expect(normalizeRestAlarmPreferences({durationSeconds: 20, vibrationEnabled: undefined, tone: undefined})).toEqual({durationSeconds: 20, vibrationEnabled: true, tone: 'classic'});
    });

    it('schedules only a future running timer', async () => {
        const gateway = {...preferenceMethods, isNativeAndroid: () => true, schedule: vi.fn().mockResolvedValue({scheduled: true, exactAlarmAllowed: true}), cancel: vi.fn(), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('running', new Date(Date.now() + 60_000).toISOString()), gateway);
        expect(gateway.schedule).toHaveBeenCalledOnce();
        expect(gateway.cancel).not.toHaveBeenCalled();
    });

    it('cancels paused, cancelled and elapsed projections', async () => {
        const gateway = {...preferenceMethods, isNativeAndroid: () => true, schedule: vi.fn(), cancel: vi.fn().mockResolvedValue(undefined), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('paused', new Date(Date.now() + 60_000).toISOString()), gateway);
        await syncNativeRestAlarm(timer('cancelled', new Date(Date.now() - 1).toISOString()), gateway);
        await syncNativeRestAlarm(undefined, gateway, 'timer-old');
        expect(gateway.schedule).not.toHaveBeenCalled();
        expect(gateway.cancel).toHaveBeenNthCalledWith(1, 'timer-1');
        expect(gateway.cancel).toHaveBeenNthCalledWith(2, 'timer-1');
        expect(gateway.cancel).toHaveBeenNthCalledWith(3, 'timer-old');
    });

    it('schedules an already elapsed running timer for immediate native delivery', async () => {
        const gateway = {...preferenceMethods, isNativeAndroid: () => true, schedule: vi.fn().mockResolvedValue({scheduled: true, exactAlarmAllowed: true}), cancel: vi.fn(), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('running', new Date(Date.now() - 1).toISOString()), gateway);
        expect(gateway.schedule).toHaveBeenCalledOnce();
        expect(gateway.cancel).not.toHaveBeenCalled();
    });

    it('does nothing in the browser', async () => {
        const gateway = {...preferenceMethods, isNativeAndroid: () => false, schedule: vi.fn(), cancel: vi.fn(), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('running', new Date(Date.now() + 60_000).toISOString()), gateway);
        expect(gateway.schedule).not.toHaveBeenCalled();
        expect(gateway.cancel).not.toHaveBeenCalled();
    });
});
