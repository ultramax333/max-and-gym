import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {MeasurementRepository} from './MeasurementRepository';

describe('MeasurementRepository', () => {
    let db: DexieDB;
    let repository: MeasurementRepository;
    let id = 0;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); db = new DexieDB(); repository = new MeasurementRepository(db, {now: () => new Date('2026-08-06T12:00:00Z'), id: () => `measurement-${++id}`}); });
    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    it('adds, edits, filters and deletes typed and custom measurements', async () => {
        const weight = await repository.add({recordedAt: '2026-08-01', type: 'weight', value: 82.4, unit: 'kg', note: ''});
        await repository.add({recordedAt: '2026-08-02', type: 'custom', customLabel: 'Mollet', value: 39, unit: 'cm', note: 'soir'});
        await repository.update(weight.id, {value: 82.1});
        expect((await repository.list('weight'))[0]).toMatchObject({value: 82.1, type: 'weight'});
        expect((await repository.list('weight'))[0].customLabel).toBeUndefined();
        expect(await repository.list()).toHaveLength(2);
        await repository.delete(weight.id);
        expect(await repository.list('weight')).toHaveLength(0);
        await expect(repository.add({recordedAt: '2026-08-03', type: 'custom', value: 1, unit: 'cm', note: ''})).rejects.toThrow('MEASUREMENT_CUSTOM_LABEL_REQUIRED');
    });
});
