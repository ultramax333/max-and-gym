import {DexieDB} from '../db/db';
import {CrowdMode, GymLocationId} from './occupancy';

export const GYM_PREFERENCE_META_KEY = 'gymAccessPreference';

export interface GymAccessPreference {
    gymId: GymLocationId;
    crowdMode: CrowdMode;
}

const DEFAULT_PREFERENCE: GymAccessPreference = {gymId: 'tunnel', crowdMode: 'auto'};

export class GymPreferenceRepository {
    constructor(private readonly db: DexieDB) {}

    async get(): Promise<GymAccessPreference> {
        const row = await this.db.appMeta.get(GYM_PREFERENCE_META_KEY);
        if (!row) return DEFAULT_PREFERENCE;
        try {
            const parsed = JSON.parse(row.value) as Partial<GymAccessPreference>;
            const gymId = ['tunnel', 'lausanne-gare', 'flon'].includes(parsed.gymId ?? '') ? parsed.gymId as GymLocationId : DEFAULT_PREFERENCE.gymId;
            const crowdMode = ['auto', 'force-quiet', 'force-busy'].includes(parsed.crowdMode ?? '') ? parsed.crowdMode as CrowdMode : DEFAULT_PREFERENCE.crowdMode;
            return {gymId, crowdMode};
        } catch {
            return DEFAULT_PREFERENCE;
        }
    }

    async save(value: GymAccessPreference): Promise<void> {
        await this.db.appMeta.put({key: GYM_PREFERENCE_META_KEY, value: JSON.stringify(value), updatedAt: new Date().toISOString()});
    }
}
