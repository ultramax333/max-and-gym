import {describe, expect, it} from 'vitest';
import {estimateProgramDay, weeklyBalance} from './duration';
import {ProgramDayDetail} from './types';

const day: ProgramDayDetail = {id: 'day', programId: 'program', name: 'Day A', sequenceIndex: 0, emphasis: 'Full body', targetDurationMinutes: 40, warmupSeconds: 300, conditioningSeconds: 240, notes: '', exercises: [{id: 'exercise', programDayId: 'day', exerciseId: 'squat', exerciseNameSnapshot: 'Squat', movementPatternSnapshot: 'squat', primaryMusclesSnapshot: ['quadriceps'], sequenceIndex: 0, role: 'primary', groupType: 'single', groupSequenceIndex: 0, locked: false, alternativeExerciseIds: [], prescriptionId: 'rx', progressionRuleId: 'rule', notes: '', prescription: {id: 'rx', workingSets: 3, repsMin: 5, repsMax: 8, targetRir: 2, restSeconds: 180, loadReferenceKg: 0}, progressionRule: {id: 'rule', kind: 'double-progression', description: 'Test', requiresApproval: true}}]};

describe('program duration and balance', () => {
    it('accounts for warm-up, ramp, work, full prescribed rest, setup and conditioning', () => {
        const result = estimateProgramDay(day);
        expect(result).toMatchObject({warmup: 300, ramp: 180, execution: 120, rest: 360, setup: 75, conditioning: 240});
        expect(result.total).toBe(1275);
    });

    it('reports weekly movement and muscle volume', () => {
        expect(weeklyBalance([day])).toMatchObject({patterns: {squat: 3}, muscles: {quadriceps: 3}});
    });
});
