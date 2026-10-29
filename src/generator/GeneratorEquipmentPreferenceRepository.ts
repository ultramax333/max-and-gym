import {DexieDB} from '../db/db';

export const GENERATOR_EQUIPMENT_META_KEY = 'generatorEquipmentPreference';
export const GENERATOR_EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'bands', 'kettlebells', 'other'];

export class GeneratorEquipmentPreferenceRepository {
    constructor(private readonly db: DexieDB) {}

    /** Checked equipment shared by both generators; a missing or unreadable value means everything is checked. */
    async get(): Promise<string[]> {
        const row = await this.db.appMeta.get(GENERATOR_EQUIPMENT_META_KEY);
        if (!row) return [...GENERATOR_EQUIPMENT];
        try {
            const parsed = JSON.parse(row.value) as unknown;
            if (!Array.isArray(parsed)) return [...GENERATOR_EQUIPMENT];
            return GENERATOR_EQUIPMENT.filter((item) => parsed.includes(item));
        } catch {
            return [...GENERATOR_EQUIPMENT];
        }
    }

    async save(equipment: string[]): Promise<void> {
        const value = GENERATOR_EQUIPMENT.filter((item) => equipment.includes(item));
        await this.db.appMeta.put({key: GENERATOR_EQUIPMENT_META_KEY, value: JSON.stringify(value), updatedAt: new Date().toISOString()});
    }
}
