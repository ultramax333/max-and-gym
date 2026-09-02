import {describe, expect, it} from 'vitest';
import {availableStations, EQUIPMENT_STATIONS, equipmentStation, orderByEquipment, requiredStations} from './equipmentStations';
import {getContrastRatio} from '@mui/material/styles';

const curl = {exerciseId: 'curl', equipmentTags: ['dumbbell'], workingSets: 3, restSeconds: 90};
const bench = {exerciseId: 'fedb:Dumbbell_Bench_Press', equipmentTags: ['dumbbell'], workingSets: 4, restSeconds: 120};
const cableBench = {exerciseId: 'fedb:Flat_Bench_Cable_Flyes', equipmentTags: ['cable'], workingSets: 2, restSeconds: 60};

describe('equipment stations', () => {
    it('recognizes a reviewed bench setup without replacing its required weights', () => {
        expect(requiredStations(bench)).toEqual(['bench', 'dumbbell']);
        expect(requiredStations(cableBench)).toEqual(['bench', 'cable']);
        expect(requiredStations({exerciseId: 'fedb:Barbell_Hip_Thrust', equipmentTags: ['barbell']})).toEqual(['bench', 'barbell']);
    });
    it('does not mistake a machine, floor press or preacher bench for a free bench', () => {
        expect(requiredStations({exerciseId: 'fedb:Machine_Bench_Press', equipmentTags: ['machine']})).toEqual(['machine']);
        expect(requiredStations({exerciseId: 'fedb:One-Arm_Kettlebell_Floor_Press', equipmentTags: ['kettlebells']})).toEqual(['kettlebell']);
        expect(requiredStations({exerciseId: 'fedb:Preacher_Curl', equipmentTags: ['barbell']})).toEqual(['preacher', 'barbell']);
    });
    it('moves bench work first once only and leaves inputs and prescriptions untouched', () => {
        const original = [curl, bench, cableBench];
        const before = JSON.stringify(original);
        const result = orderByEquipment(original, ['bench', 'dumbbell', 'cable']);
        expect(result.map((exercise) => exercise.exerciseId)).toEqual([bench.exerciseId, cableBench.exerciseId, curl.exerciseId]);
        expect(result.map((exercise) => exercise.equipmentStation)).toEqual(['bench', 'bench', 'dumbbell']);
        expect(result.map(({equipmentStation: _station, ...exercise}) => exercise)).toEqual([bench, cableBench, curl]);
        expect(JSON.stringify(original)).toBe(before);
    });
    it('allows cables first for an exercise needing both cables and a bench', () => {
        const result = orderByEquipment([curl, bench, cableBench], ['cable', 'bench', 'dumbbell']);
        expect(result[0]).toEqual({...cableBench, equipmentStation: 'cable'});
        expect(new Set(result.map((exercise) => exercise.exerciseId)).size).toBe(3);
    });
    it('keeps mixed equipment supersets together and their execution order intact', () => {
        const pairedCurl = {...curl, groupId: 'pair', groupSequenceIndex: 1};
        const pairedBench = {...bench, groupId: 'pair', groupSequenceIndex: 0};
        const result = orderByEquipment([pairedCurl, cableBench, pairedBench], ['cable', 'bench', 'dumbbell']);
        expect(result.map((exercise) => exercise.exerciseId)).toEqual([cableBench.exerciseId, bench.exerciseId, curl.exerciseId]);
        expect(result.slice(1).map((exercise) => exercise.equipmentStation)).toEqual(['bench', 'bench']);
    });
    it('appends omitted stations stably and handles absent or unknown metadata', () => {
        expect(availableStations([curl, bench, cableBench])).toEqual(['dumbbell', 'bench', 'cable']);
        const unknown = {exerciseId: 'old-custom'};
        expect(requiredStations(unknown)).toEqual(['other']);
        expect(equipmentStation(unknown)).toBe('other');
        expect(orderByEquipment([curl, unknown, bench], ['bench', 'bench']).map((exercise) => exercise.exerciseId)).toEqual([bench.exerciseId, curl.exerciseId, unknown.exerciseId]);
        expect(orderByEquipment([], [])).toEqual([]);
    });
    it('keeps every named badge readable on the dark card background', () => {
        for (const station of Object.values(EQUIPMENT_STATIONS)) expect(getContrastRatio(station.color, '#101720')).toBeGreaterThanOrEqual(4.5);
    });
});
