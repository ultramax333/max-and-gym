import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DexieDB} from '../db/db';
import {RestTimerRecord} from '../workout/types';
import {RestTimerAlarmRepository, showRestNotification} from './restTimerNotifications';

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
