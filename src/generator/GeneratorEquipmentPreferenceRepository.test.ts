import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {GENERATOR_EQUIPMENT, GENERATOR_EQUIPMENT_META_KEY, GeneratorEquipmentPreferenceRepository} from './GeneratorEquipmentPreferenceRepository';

describe('generator equipment preference', () => {
    let db: DexieDB;
    let repository: GeneratorEquipmentPreferenceRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new GeneratorEquipmentPreferenceRepository(db);
    });

    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    it('checks all equipment by default', async () => {
        expect(await repository.get()).toEqual(GENERATOR_EQUIPMENT);
    });

    it('remembers unchecked equipment across repository instances', async () => {
        const chosen = GENERATOR_EQUIPMENT.filter((item) => item !== 'bands' && item !== 'body only');
        await repository.save(chosen);
        expect(await new GeneratorEquipmentPreferenceRepository(db).get()).toEqual(chosen);
        await repository.save([]);
        expect(await repository.get()).toEqual([]);
    });

    it('ignores unknown values', async () => {
        await db.appMeta.put({key: GENERATOR_EQUIPMENT_META_KEY, value: JSON.stringify(['dumbbell', 'jetpack', 7, 'cable']), updatedAt: new Date().toISOString()});
        expect(await repository.get()).toEqual(['dumbbell', 'cable']);
    });

    it('recovers safely from invalid local JSON', async () => {
        await db.appMeta.put({key: GENERATOR_EQUIPMENT_META_KEY, value: '{bad', updatedAt: new Date().toISOString()});
        expect(await repository.get()).toEqual(GENERATOR_EQUIPMENT);
        await db.appMeta.put({key: GENERATOR_EQUIPMENT_META_KEY, value: '{"bands":true}', updatedAt: new Date().toISOString()});
        expect(await repository.get()).toEqual(GENERATOR_EQUIPMENT);
    });
});
