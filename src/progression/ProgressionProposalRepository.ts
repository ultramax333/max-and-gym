import {DexieDB} from '../db/db';
import {ProgressionProposalRecord} from './types';

export interface ProgressionProposalDetail {
    proposal: ProgressionProposalRecord;
    programName: string;
    exerciseName: string;
    savedTargetKg?: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    targetRir?: number;
    completedSets: number;
    totalSets: number;
    lastCompleted?: {loadKg:number; repetitions:number};
}

export class ProgressionProposalRepository {
    constructor(private readonly db: DexieDB, private readonly now: () => Date = () => new Date()) {}

    list(status?: ProgressionProposalRecord['status']): Promise<ProgressionProposalRecord[]> {
        return status ? this.db.progressionProposal.where('status').equals(status).sortBy('createdAt') : this.db.progressionProposal.orderBy('createdAt').toArray();
    }

    listForSession(sessionId: string): Promise<ProgressionProposalRecord[]> {
        return this.db.progressionProposal.where('sessionId').equals(sessionId).sortBy('createdAt');
    }

    async detail(id: string): Promise<ProgressionProposalDetail | undefined> {
        const proposal = await this.db.progressionProposal.get(id);
        if (!proposal) return undefined;
        const [program, exercise, prescription, sessionExercises, sessionSets] = await Promise.all([
            this.db.trainingProgram.get(proposal.programId),
            this.db.programExercise.get(proposal.programExerciseId),
            this.db.exercisePrescription.get(proposal.prescriptionId),
            this.db.sessionExercise.where('sessionId').equals(proposal.sessionId).toArray(),
            this.db.performedSet.where('sessionId').equals(proposal.sessionId).toArray(),
        ]);
        const sessionExercise = sessionExercises.find(entry => entry.programExerciseId === proposal.programExerciseId);
        const relevant = sessionExercise ? sessionSets.filter(entry => entry.sessionExerciseId === sessionExercise.id && (entry.setKind ?? 'working') === 'working') : [];
        const completed = relevant.filter(entry => entry.status === 'completed');
        const last = completed.at(-1);
        return {
            proposal,
            programName: program?.name ?? 'Saved program',
            exerciseName: sessionExercise?.exerciseNameSnapshot ?? exercise?.exerciseNameSnapshot ?? proposal.exerciseId.replace(/^fedb:/,'').replaceAll('_',' '),
            savedTargetKg: prescription?.loadReferenceKg,
            targetRepsMin: prescription?.repsMin,
            targetRepsMax: prescription?.repsMax,
            targetRir: prescription?.targetRir,
            completedSets: completed.length,
            totalSets: relevant.length,
            lastCompleted: last?.actualReps === undefined ? undefined : {loadKg:last.actualLoadKg ?? last.targetLoadKg, repetitions:last.actualReps},
        };
    }

    async accept(id: string, editedLoadKg?: number): Promise<ProgressionProposalRecord> {
        return this.confirm(id, editedLoadKg === undefined ? 'accepted' : 'edited', editedLoadKg);
    }

    private async confirm(id: string, status: 'accepted' | 'edited', editedLoadKg?: number): Promise<ProgressionProposalRecord> {
        if (editedLoadKg !== undefined && (!Number.isFinite(editedLoadKg) || editedLoadKg < 0)) throw new Error('Edited load must be a nonnegative finite value.');
        const now = this.now().toISOString();
        await this.db.transaction('rw', [this.db.progressionProposal, this.db.exercisePrescription], async () => {
            const proposal = await this.db.progressionProposal.get(id);
            if (!proposal) throw new Error('Progression proposal not found.');
            if (proposal.status === 'accepted' || proposal.status === 'edited') return;
            if (proposal.status !== 'pending' && proposal.status !== 'postponed') throw new Error('Only pending or postponed proposals can be confirmed.');
            const prescription = await this.db.exercisePrescription.get(proposal.prescriptionId);
            if (!prescription) throw new Error('Prescription not found.');
            const nextLoad = editedLoadKg ?? proposal.proposedLoadKg;
            if (nextLoad !== undefined) await this.db.exercisePrescription.update(prescription.id, {loadReferenceKg: Math.max(0, nextLoad)});
            await this.db.progressionProposal.update(id, {status, proposedLoadKg: nextLoad, decidedAt: now, updatedAt: now});
        });
        return (await this.db.progressionProposal.get(id))!;
    }

    async reject(id: string): Promise<ProgressionProposalRecord> { return this.decideWithoutMutation(id, 'rejected'); }
    async postpone(id: string): Promise<ProgressionProposalRecord> { return this.decideWithoutMutation(id, 'postponed'); }

    private async decideWithoutMutation(id: string, status: 'rejected' | 'postponed'): Promise<ProgressionProposalRecord> {
        const proposal = await this.db.progressionProposal.get(id);
        if (!proposal) throw new Error('Progression proposal not found.');
        if (proposal.status !== 'pending' && !(status === 'rejected' && proposal.status === 'postponed')) throw new Error('Only pending or postponed proposals can be dismissed.');
        const now = this.now().toISOString();
        await this.db.progressionProposal.update(id, {status, decidedAt: now, updatedAt: now});
        return (await this.db.progressionProposal.get(id))!;
    }
}
