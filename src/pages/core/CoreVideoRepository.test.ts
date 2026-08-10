import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {DexieDB} from '../../db/db';
import {CoreVideoRepository, CUSTOM_CORE_VIDEOS_META_KEY} from './CoreVideoRepository';

describe('personal core video library', () => {
    let database: DexieDB;
    let repository: CoreVideoRepository;
    beforeEach(async () => { localStorage.setItem('userName', 'Default User'); await Dexie.delete('weightlog'); database = new DexieDB(); repository = new CoreVideoRepository(database); });
    afterEach(async () => { database.close(); await Dexie.delete('weightlog'); localStorage.clear(); });

    const input = {url: 'https://youtu.be/dQw4w9WgXcQ', title: 'My core class', channel: 'Trainer', durationMinutes: 10 as const, level: 'Beginner', equipment: 'No equipment', focus: 'Deep core'};

    it('creates, edits and removes a local video', async () => {
        const created = await repository.create(input);
        expect(await repository.list()).toMatchObject([{youtubeId: 'dQw4w9WgXcQ', title: 'My core class', curated: false}]);
        await repository.update(created.id, {...input, title: 'Edited class', durationMinutes: 15});
        expect(await repository.list()).toMatchObject([{title: 'Edited class', durationMinutes: 15}]);
        await repository.remove(created.id);
        expect(await repository.list()).toEqual([]);
        expect(await database.appMeta.get(CUSTOM_CORE_VIDEOS_META_KEY)).toBeUndefined();
    });

    it('rejects invalid and duplicate YouTube URLs', async () => {
        await expect(repository.create({...input, url: 'https://youtube.example/watch?v=xsvLYAplbXw'})).rejects.toThrow('valid YouTube');
        await repository.create(input);
        await expect(repository.create(input)).rejects.toThrow('already');
        await expect(repository.create({...input, url: 'https://youtu.be/xsvLYAplbXw'})).rejects.toThrow('already');
    });

    it('recovers safely from invalid stored JSON', async () => {
        await database.appMeta.put({key: CUSTOM_CORE_VIDEOS_META_KEY, value: '{broken', updatedAt: new Date().toISOString()});
        expect(await repository.list()).toEqual([]);
    });
});
