import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DexieDB} from '../db/db';
import {RestTimerRecord} from '../workout/types';
import {reconcileRestTimerExpiry, RestTimerAlarmRepository, shouldMonitorRestTimerExpiryInPage, showRestNotification} from './restTimerNotifications';

describe('rest timer notifications', () => {
    let db: DexieDB;
    let repository: RestTimerAlarmRepository;
    const timer: RestTimerRecord = {
        id: 'timer-1',
        sessionId: 'session-1',
        performedSetId: 'set-1',
        startedAt: '2026-08-07T18:00:00.000Z',
        endsAt: '2026-08-07T18:01:15.000Z',
        status: 'running',
        createdAt: '2026-08-07T18:00:00.000Z',
        updatedAt: '2026-08-07T18:00:00.000Z',
    };

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        await db.restTimer.put(timer);
        repository = new RestTimerAlarmRepository(db);
    });

    afterEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
        vi.unstubAllGlobals();
    });

    it('atomically claims an expired timer exactly once', async () => {
        const completed = await repository.claimExpired(timer.id, new Date('2026-08-07T18:01:16.000Z'));
        expect(completed).toMatchObject({id: timer.id, status: 'completed', signalDeliveredAt: '2026-08-07T18:01:16.000Z'});
        await expect(repository.claimExpired(timer.id, new Date('2026-08-07T18:01:17.000Z'))).resolves.toBeUndefined();
        await expect(db.restTimer.get(timer.id)).resolves.toMatchObject({status: 'completed'});
    });

    it('does not claim a timer before its deadline', async () => {
        await expect(repository.claimExpired(timer.id, new Date('2026-08-07T18:01:14.000Z'))).resolves.toBeUndefined();
        const stored = await db.restTimer.get(timer.id);
        expect(stored).toMatchObject({status: 'running'});
        expect(stored).not.toHaveProperty('signalDeliveredAt');
    });

    it('acknowledges a native delivery exactly once before recovery can cancel it', async () => {
        const deliveredAt = new Date('2026-08-07T18:01:15.500Z');
        const acknowledged = await repository.acknowledgeNativeDelivery(timer.id, deliveredAt);
        expect(acknowledged).toMatchObject({id: timer.id, status: 'completed', signalDeliveredAt: deliveredAt.toISOString()});
        await expect(repository.acknowledgeNativeDelivery(timer.id, new Date('2026-08-07T18:01:16.000Z'))).resolves.toBeUndefined();
        await expect(db.restTimer.get(timer.id)).resolves.toMatchObject({status: 'completed', signalDeliveredAt: deliveredAt.toISOString()});
    });

    it('rejects a stale native delivery after the persisted deadline was extended', async () => {
        const oldEndsAt = new Date(timer.endsAt).getTime();
        await db.restTimer.update(timer.id, {endsAt: '2026-08-07T18:02:15.000Z'});
        await expect(repository.acknowledgeNativeDelivery(timer.id, new Date('2026-08-07T18:01:15.500Z'), oldEndsAt)).resolves.toBeUndefined();
        await expect(db.restTimer.get(timer.id)).resolves.toMatchObject({status: 'running', endsAt: '2026-08-07T18:02:15.000Z'});
    });

    it('rejects a native delivery timestamp before the current persisted deadline', async () => {
        await expect(repository.acknowledgeNativeDelivery(timer.id, new Date('2026-08-07T18:01:14.999Z'))).resolves.toBeUndefined();
        await expect(db.restTimer.get(timer.id)).resolves.toMatchObject({status: 'running'});
    });

    it('reconciles a foreground native expiry without starting a second web alarm', async () => {
        const received = vi.fn();
        const vibrate = vi.fn();
        const originalVibrate = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
        Object.defineProperty(navigator, 'vibrate', {configurable: true, value: vibrate});
        window.addEventListener('max-gym-rest-timer-complete', received);
        try {
            const completed = await reconcileRestTimerExpiry(repository, timer, {nativeDelivery: true, now: new Date('2026-08-07T18:01:16.000Z')});
            expect(completed).toMatchObject({status: 'completed', signalDeliveredAt: '2026-08-07T18:01:16.000Z'});
            expect(received).toHaveBeenCalledOnce();
            expect(vibrate).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener('max-gym-rest-timer-complete', received);
            if (originalVibrate) Object.defineProperty(navigator, 'vibrate', originalVibrate);
            else delete (navigator as unknown as {vibrate?: unknown}).vibrate;
        }
    });

    it('leaves expiry authority to Android instead of a page timeout in the native app', () => {
        expect(shouldMonitorRestTimerExpiryInPage(true)).toBe(false);
        expect(shouldMonitorRestTimerExpiryInPage(false)).toBe(true);
    });

    it('uses the local service worker when notification permission is granted', async () => {
        vi.stubGlobal('Notification', {permission: 'granted'});
        const showNotification = vi.fn().mockResolvedValue(undefined);
        await showRestNotification(timer, async () => ({showNotification}));
        expect(showNotification).toHaveBeenCalledWith('Rest complete', expect.objectContaining({
            body: 'Time for your next set.',
            tag: `rest-timer-${timer.id}`,
            requireInteraction: true,
        }));
    });
});
