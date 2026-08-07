import {syncNativeRestAlarm} from './restAlarmGateway';
import {RestTimerRecord} from '../workout/types';
import {describe, expect, it, vi} from 'vitest';

const timer = (status: RestTimerRecord['status'], endsAt: string): RestTimerRecord => ({
    id: 'timer-1', sessionId: 'session-1', performedSetId: 'set-1', startedAt: '2026-08-07T10:00:00.000Z',
    endsAt, status, createdAt: '2026-08-07T10:00:00.000Z', updatedAt: '2026-08-07T10:00:00.000Z',
});

describe('native rest alarm synchronization', () => {
    it('schedules only a future running timer', async () => {
        const gateway = {isNativeAndroid: () => true, schedule: vi.fn().mockResolvedValue({scheduled: true, exactAlarmAllowed: true}), cancel: vi.fn(), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('running', new Date(Date.now() + 60_000).toISOString()), gateway);
        expect(gateway.schedule).toHaveBeenCalledOnce();
        expect(gateway.cancel).not.toHaveBeenCalled();
    });

    it('cancels paused, cancelled and elapsed projections', async () => {
        const gateway = {isNativeAndroid: () => true, schedule: vi.fn(), cancel: vi.fn().mockResolvedValue(undefined), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('paused', new Date(Date.now() + 60_000).toISOString()), gateway);
        await syncNativeRestAlarm(timer('running', new Date(Date.now() - 1).toISOString()), gateway);
        await syncNativeRestAlarm(undefined, gateway, 'timer-old');
        expect(gateway.schedule).not.toHaveBeenCalled();
        expect(gateway.cancel).toHaveBeenNthCalledWith(1, 'timer-1');
        expect(gateway.cancel).toHaveBeenNthCalledWith(2, 'timer-1');
        expect(gateway.cancel).toHaveBeenNthCalledWith(3, 'timer-old');
    });

    it('does nothing in the browser', async () => {
        const gateway = {isNativeAndroid: () => false, schedule: vi.fn(), cancel: vi.fn(), getCapabilities: vi.fn(), requestNotificationPermission: vi.fn(), requestExactAlarmPermission: vi.fn(), consumeLastAction: vi.fn(), addActionListener: vi.fn()};
        await syncNativeRestAlarm(timer('running', new Date(Date.now() + 60_000).toISOString()), gateway);
        expect(gateway.schedule).not.toHaveBeenCalled();
        expect(gateway.cancel).not.toHaveBeenCalled();
    });
});
