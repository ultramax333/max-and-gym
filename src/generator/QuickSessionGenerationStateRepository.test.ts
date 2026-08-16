import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../db/db';
import {QuickSessionGenerationStateRepository} from './QuickSessionGenerationStateRepository';

describe('quick-session generation state', () => {
    let db: DexieDB;
    let repository: QuickSessionGenerationStateRepository;

    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        await Dexie.delete('weightlog');
        db = new DexieDB();
        repository = new QuickSessionGenerationStateRepository(db);
    });

    afterEach(async () => { db.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    it('persists a monotone variation and the four latest generations per zone', async () => {
        await repository.record('arms', 1, ['curl-a', 'extension-a']);
        await repository.record('arms', 2, ['curl-b']);
        await repository.record('arms', 3, ['curl-c']);
        await repository.record('arms', 4, ['curl-d']);
        const state = await repository.record('arms', 5, ['curl-e']);
        expect(state).toEqual({nextVariation: 6, recentGenerations: [['curl-e'], ['curl-d'], ['curl-c'], ['curl-b']]});
        expect(await new QuickSessionGenerationStateRepository(db).get('arms')).toEqual(state);
        expect(await repository.get('chest')).toEqual({nextVariation: 1, recentGenerations: []});
    });

    it('recovers safely from invalid local JSON', async () => {
        await db.appMeta.put({key: 'quickSessionGenerationState:arms', value: '{bad', updatedAt: new Date().toISOString()});
        expect(await repository.get('arms')).toEqual({nextVariation: 1, recentGenerations: []});
    });
});
