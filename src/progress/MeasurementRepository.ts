import {DexieDB} from '../db/db';
import {BodyMeasurementRecord, BodyMeasurementType} from './types';

interface MeasurementClock {now: () => Date; id: () => string}
const defaultClock: MeasurementClock = {now: () => new Date(), id: () => globalThis.crypto.randomUUID()};

export class MeasurementRepository {
    constructor(private readonly db: DexieDB, private readonly clock: MeasurementClock = defaultClock) {}

    async list(type?: BodyMeasurementType): Promise<BodyMeasurementRecord[]> {
        const values = type ? await this.db.bodyMeasurement.where('type').equals(type).toArray() : await this.db.bodyMeasurement.toArray();
        return values.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || b.id.localeCompare(a.id));
    }

    async add(input: Pick<BodyMeasurementRecord, 'recordedAt' | 'type' | 'customLabel' | 'value' | 'unit' | 'note'>): Promise<BodyMeasurementRecord> {
        if (!Number.isFinite(input.value) || input.value <= 0) throw new Error('MEASUREMENT_VALUE_INVALID');
        if (input.type === 'custom' && !input.customLabel?.trim()) throw new Error('MEASUREMENT_CUSTOM_LABEL_REQUIRED');
        const now = this.clock.now().toISOString();
        const record: BodyMeasurementRecord = {...input, id: this.clock.id(), customLabel: input.type === 'custom' ? input.customLabel?.trim() : undefined, note: input.note.trim(), createdAt: now, updatedAt: now};
        await this.db.bodyMeasurement.add(record);
        return record;
    }

    async update(id: string, change: Partial<Pick<BodyMeasurementRecord, 'recordedAt' | 'customLabel' | 'value' | 'unit' | 'note'>>): Promise<void> {
        if (change.value !== undefined && (!Number.isFinite(change.value) || change.value <= 0)) throw new Error('MEASUREMENT_VALUE_INVALID');
        if (!(await this.db.bodyMeasurement.update(id, {...change, updatedAt: this.clock.now().toISOString()}))) throw new Error('MEASUREMENT_NOT_FOUND');
    }

    async delete(id: string): Promise<void> { await this.db.bodyMeasurement.delete(id); }
}
