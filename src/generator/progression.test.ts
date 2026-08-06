import {describe, expect, it} from 'vitest';
import {calculateProgression, ProgressionInput} from './progression';

const base = (change: Partial<ProgressionInput> = {}): ProgressionInput => ({exerciseId: 'squat', kind: 'double-progression', sets: [{reps: 8, loadKg: 100, rir: 2, completed: true}, {reps: 8, loadKg: 100, rir: 2, completed: true}], repsMax: 8, targetRir: 2, currentLoadKg: 100, incrementKg: 2.5, comparableMisses: 0, discomfort: false, createdAt: '2026-08-06T12:00:00Z', ...change});

describe('progression proposals', () => {
    it('proposes double, fixed and top/back-off increases without applying them', () => {
        expect(calculateProgression(base())).toMatchObject({status: 'pending', proposedLoadKg: 102.5, reasonCode: 'SUCCESS_INCREASE', requiresConfirmation: true});
        expect(calculateProgression(base({kind: 'fixed-increment'}))).toMatchObject({proposedLoadKg: 102.5});
        expect(calculateProgression(base({kind: 'top-set-back-off'}))).toMatchObject({proposedLoadKg: 102.5, proposedBackoffLoadKg: 92.5});
    });

    it('holds incomplete work and discomfort and proposes deload review after comparable misses', () => {
        const incomplete = calculateProgression(base({sets: [{reps: 6, loadKg: 100, completed: true}]}));
        const discomfort = calculateProgression(base({discomfort: true}));
        expect(incomplete).toMatchObject({reasonCode: 'HOLD_INCOMPLETE'});
        expect(incomplete).not.toHaveProperty('proposedLoadKg');
        expect(discomfort).toMatchObject({reasonCode: 'DISCOMFORT_HOLD'});
        expect(discomfort).not.toHaveProperty('proposedLoadKg');
        expect(calculateProgression(base({comparableMisses: 2}))).toMatchObject({reasonCode: 'DELOAD_REVIEW', proposedLoadKg: 90});
    });

    it('changes one conditioning variable and supports manual hold', () => {
        expect(calculateProgression(base({kind: 'conditioning-time', conditioningSeconds: 360}))).toMatchObject({proposedConditioningSeconds: 390, reasonCode: 'CONDITIONING_INCREASE'});
        expect(calculateProgression(base({kind: 'manual-hold'}))).toMatchObject({reasonCode: 'MANUAL_HOLD'});
    });
});
