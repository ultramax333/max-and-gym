export type ProgressionKind = 'double-progression' | 'fixed-increment' | 'top-set-back-off' | 'conditioning-time' | 'manual-hold' | 'deload-review';
export type ProgressionStatus = 'pending' | 'accepted' | 'edited' | 'rejected' | 'postponed';

export interface ProgressionSet {reps: number; loadKg: number; rir?: number; completed: boolean}
export interface ProgressionInput {
    exerciseId: string;
    kind: ProgressionKind;
    sets: ProgressionSet[];
    repsMax: number;
    targetRir: number;
    currentLoadKg: number;
    incrementKg: number;
    comparableMisses: number;
    discomfort: boolean;
    conditioningSeconds?: number;
    createdAt: string;
}

export interface ProgressionProposal {
    exerciseId: string;
    kind: ProgressionKind;
    status: ProgressionStatus;
    proposedLoadKg?: number;
    proposedBackoffLoadKg?: number;
    proposedConditioningSeconds?: number;
    reasonCode: 'SUCCESS_INCREASE' | 'HOLD_INCOMPLETE' | 'DISCOMFORT_HOLD' | 'DELOAD_REVIEW' | 'CONDITIONING_INCREASE' | 'MANUAL_HOLD';
    reason: string;
    requiresConfirmation: true;
    createdAt: string;
}

const roundIncrement = (value: number, increment: number) => Math.round(value / Math.max(0.25, increment)) * Math.max(0.25, increment);

export function calculateProgression(input: ProgressionInput): ProgressionProposal {
    const base = {exerciseId: input.exerciseId, kind: input.kind, status: 'pending' as const, requiresConfirmation: true as const, createdAt: input.createdAt};
    if (input.discomfort) return {...base, reasonCode: 'DISCOMFORT_HOLD', reason: 'Increase paused because of associated discomfort.'};
    if (input.kind === 'manual-hold') return {...base, reasonCode: 'MANUAL_HOLD', reason: 'Manual hold requested.'};
    if (input.kind === 'conditioning-time') return {...base, proposedConditioningSeconds: (input.conditioningSeconds ?? 0) + 30, reasonCode: 'CONDITIONING_INCREASE', reason: 'Add 30 seconds to one conditioning variable.'};
    if (input.kind === 'deload-review' || input.comparableMisses >= 2) return {...base, proposedLoadKg: roundIncrement(input.currentLoadKg * 0.9, input.incrementKg), reasonCode: 'DELOAD_REVIEW', reason: 'Two comparable misses: a reduction is proposed for review.'};
    const completed = input.sets.length > 0 && input.sets.every((set) => set.completed && set.reps >= input.repsMax && (set.rir ?? input.targetRir) >= input.targetRir);
    if (!completed) return {...base, reasonCode: 'HOLD_INCOMPLETE', reason: 'Keep the prescription until all sets are completed successfully.'};
    const proposedLoadKg = roundIncrement(input.currentLoadKg + input.incrementKg, input.incrementKg);
    if (input.kind === 'top-set-back-off') return {...base, proposedLoadKg, proposedBackoffLoadKg: roundIncrement(proposedLoadKg * 0.9, input.incrementKg), reasonCode: 'SUCCESS_INCREASE', reason: 'Top set completed: proposed increase and recalculated back-off.'};
    return {...base, proposedLoadKg, reasonCode: 'SUCCESS_INCREASE', reason: input.kind === 'fixed-increment' ? 'Target achieved: fixed increment proposed.' : 'Top of the rep range reached at target RIR: increase proposed.'};
}
