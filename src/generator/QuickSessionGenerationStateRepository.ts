import {DexieDB} from '../db/db';
import {QuickSessionZone} from './quickSession';

const PREFIX = 'quickSessionGenerationState:';
const RECENT_GENERATION_LIMIT = 2;

export interface QuickSessionGenerationState {
    nextVariation: number;
    recentGenerations: string[][];
}

function defaultState(): QuickSessionGenerationState {
    return {nextVariation: 1, recentGenerations: []};
}

function normalize(raw: unknown): QuickSessionGenerationState {
    if (!raw || typeof raw !== 'object') return defaultState();
    const candidate = raw as Partial<QuickSessionGenerationState>;
    const nextVariation = Number.isInteger(candidate.nextVariation) && (candidate.nextVariation ?? 0) > 0 ? candidate.nextVariation! : 1;
    const recentGenerations = Array.isArray(candidate.recentGenerations)
        ? candidate.recentGenerations.filter(Array.isArray).map((generation) => [...new Set(generation.filter((id): id is string => typeof id === 'string' && id.length > 0))]).filter((generation) => generation.length > 0).slice(0, RECENT_GENERATION_LIMIT)
        : [];
    return {nextVariation, recentGenerations};
}

export class QuickSessionGenerationStateRepository {
    constructor(private readonly db: DexieDB) {}

    async get(zone: QuickSessionZone): Promise<QuickSessionGenerationState> {
        const record = await this.db.appMeta.get(`${PREFIX}${zone}`);
        if (!record) return defaultState();
        try { return normalize(JSON.parse(record.value)); }
        catch { return defaultState(); }
    }

    async record(zone: QuickSessionZone, variation: number, exerciseIds: string[]): Promise<QuickSessionGenerationState> {
        const current = await this.get(zone);
        const next = normalize({nextVariation: Math.max(current.nextVariation, variation + 1), recentGenerations: [[...new Set(exerciseIds)], ...current.recentGenerations]});
        const now = new Date().toISOString();
        await this.db.appMeta.put({key: `${PREFIX}${zone}`, value: JSON.stringify(next), updatedAt: now});
        return next;
    }
}
