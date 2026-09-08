import {describe, expect, it} from 'vitest';
import seed from './reviewed-exercises.json';
import {ReviewedExercise} from './types';
import {HARD_EXCLUSION_TAGS, hasAvailableEquipment, isSelectionEligible, matchesQuickSessionZone, QUICK_SESSION_ZONES, selectExerciseAlternatives} from './selection';
import {matchesRole} from '../generator/constraints';
import {requiredStations} from '../workout/equipmentStations';

const catalog = seed as ReviewedExercise[];
const get = (id: string) => catalog.find(e => e.sourceId === id)!;
describe('reviewed classification and shared alternatives', () => {
    it('never mistakes upper-body kickbacks or calf presses for posterior/squat roles', () => {
        expect(get('Tricep_Dumbbell_Kickback').movementPattern).toBe('accessory');
        expect(matchesRole(get('Tricep_Dumbbell_Kickback'), 'posterior-assistance')).toBe(false);
        for (const id of ['Calf_Press', 'Calf_Press_On_The_Leg_Press_Machine']) {
            expect(get(id).movementPattern).toBe('accessory');
            expect(matchesRole(get(id), 'leg-assistance')).toBe(false);
        }
        expect(get('Natural_Glute_Ham_Raise').movementPattern).toBe('accessory');
        expect(get('Cable_Hip_Adduction').primaryMuscles).toEqual(['adductors']);
        expect(get('Pushups').movementPattern).toBe('push');
        expect(get('Incline_Dumbbell_Bench_With_Palms_Facing_In').movementPattern).toBe('push');
    });
    it('does not match unrelated muscles solely through a broad movement label', () => {
        for (const id of ['Barbell_Hip_Thrust', 'Thigh_Abductor']) {
            const options = selectExerciseAlternatives(catalog, get(id));
            expect(options.length).toBeGreaterThan(0);
            expect(options.some(e => e.primaryMuscles.some(m => ['biceps','triceps','chest','shoulders'].includes(m)))).toBe(false);
        }
    });
    it('filters preferred, excluded, archived, unreviewed and unavailable records before ranking', () => {
        const base = get('Single_Leg_Glute_Bridge');
        const fixtures = [
            {...base, id:'never', effectiveNeverSuggest:true}, {...base, id:'archived', archived:true},
            {...base, id:'unreviewed', contentStatus:'imported' as 'reviewed'}, {...base, id:'tag', setupTags:['user-blocked']},
            {...base, id:'id-blocked'}, {...base, id:'duplicate'}, {...base, id:'valid'},
            get('Tricep_Dumbbell_Kickback'), get('Barbell_Hip_Thrust'),
        ];
        const options = selectExerciseAlternatives(fixtures, get('Glute_Kickback'), {zone:'glutes', equipment:['body only'], blockedTags:['user-blocked'], blockedExerciseIds:['id-blocked'], selectedIds:['duplicate'], preferredIds:fixtures.map(e => e.id)});
        expect(options.map(e => e.id)).toEqual(['valid']);
        expect(selectExerciseAlternatives(fixtures, get('Glute_Kickback'), {zone:'unknown'})).toEqual([]);
    });
    it('enforces cumulative resistance requirements and intrinsic hard exclusions', () => {
        const assisted = get('Band_Assisted_Pull-Up');
        expect(assisted.equipmentTags).toEqual(['bands','body only']);
        expect(hasAvailableEquipment(assisted, ['bands'])).toBe(false);
        expect(hasAvailableEquipment(assisted, ['body only'])).toBe(false);
        expect(hasAvailableEquipment(assisted, ['bands','body only'])).toBe(true);
        expect(hasAvailableEquipment({equipmentTags:[]}, ['other'])).toBe(false);
        expect(get('Seated_Band_Hamstring_Curl').equipmentTags).toEqual(['bands']);
        for (const id of ['Dips_-_Chest_Version','Knee_Hip_Raise_On_Parallel_Bars']) expect(hasAvailableEquipment(get(id), ['other'])).toBe(false);
        for (const tag of HARD_EXCLUSION_TAGS) expect(isSelectionEligible({...assisted, impactTags:[tag]})).toBe(false);
    });
    it('shows auxiliary equipment without confusing built-in seats or optional benches', () => {
        const stations = (id: string) => requiredStations({exerciseId:get(id).id, equipmentTags:get(id).equipmentTags});
        expect(stations('Barbell_Squat_To_A_Bench')).toContain('bench');
        expect(stations('Push-Ups_With_Feet_Elevated')).toContain('bench');
        expect(stations('Seated_Band_Hamstring_Curl')).toEqual(['bench','bands']);
        expect(stations('Dips_-_Chest_Version')).toContain('parallel');
        expect(stations('Band_Assisted_Pull-Up')).toContain('pullup');
        expect(stations('Cable_Russian_Twists')).toContain('ball');
        expect(stations('Smith_Machine_Bench_Press')).toEqual(['machine','bench']);
        expect(stations('Machine_Bench_Press')).toEqual(['machine']);
        expect(stations('Dumbbell_One-Arm_Shoulder_Press')).not.toContain('bench');
    });
    it('keeps every focused alternative in its requested area across the catalogue', () => {
        for (const {value:zone} of QUICK_SESSION_ZONES) for (const current of catalog.filter(e => matchesQuickSessionZone(e, zone))) {
            const options = selectExerciseAlternatives(catalog, current, {zone, preferredIds:catalog.slice(0,5).map(e => e.id)});
            expect(options.every(e => matchesQuickSessionZone(e, zone) && isSelectionEligible(e))).toBe(true);
        }
    });
});
