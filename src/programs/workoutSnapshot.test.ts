import {describe, expect, it} from 'vitest';
import {programDayWorkoutInput} from './workoutSnapshot';
import {ProgramDayDetail} from './types';

describe('program workout snapshot', () => {
    it('preserves groups and advanced set schemes in an immutable session input', () => {
        const day: ProgramDayDetail = {id: 'day', programId: 'program', name: 'Arms', sequenceIndex: 0, emphasis: 'Arms', targetDurationMinutes: 40, warmupSeconds: 300, conditioningSeconds: 0, notes: '', exercises: [{id: 'pe', programDayId: 'day', exerciseId: 'curl', exerciseNameSnapshot: 'Curl', movementPatternSnapshot: 'pull', primaryMusclesSnapshot: ['biceps'], sequenceIndex: 0, role: 'accessory', groupId: 'group', groupType: 'superset', groupSequenceIndex: 0, locked: false, alternativeExerciseIds: [], prescriptionId: 'rx', progressionRuleId: 'rule', notes: '', prescription: {id: 'rx', workingSets: 3, repsMin: 8, repsMax: 12, targetRir: 2, restSeconds: 75, loadReferenceKg: 14, setScheme: 'drop', warmupSets: 1, dropSets: 2}, progressionRule: {id: 'rule', kind: 'double-progression', description: 'Progress', requiresApproval: true}}]};
        const result = programDayWorkoutInput('Program', day);
        expect(result.exercises[0]).toMatchObject({groupId: 'group', groupType: 'superset', setScheme: 'drop', warmupSets: 1, dropSets: 2});
        expect(result.plannedDurationSeconds).toBe(2400);
        expect(result.exercises[0].prescriptionSnapshot).toContain('1 warm-up');
    });
});
