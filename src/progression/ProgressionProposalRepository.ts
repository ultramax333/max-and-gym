import {DexieDB} from '../db/db';
import {ProgressionProposalRecord} from './types';

export class ProgressionProposalRepository {
    constructor(private readonly db: DexieDB, private readonly now: () => Date = () => new Date()) {}

    list(status?: ProgressionProposalRecord['status']): Promise<ProgressionProposalRecord[]> {
        return status ? this.db.progressionProposal.where('status').equals(status).sortBy('createdAt') : this.db.progressionProposal.orderBy('createdAt').toArray();
    }

    async accept(id: string, editedLoadKg?: number): Promise<ProgressionProposalRecord> {
        return this.confirm(id, editedLoadKg === undefined ? 'accepted' : 'edited', editedLoadKg);
    }

    private async confirm(id: string, status: 'accepted' | 'edited', editedLoadKg?: number): Promise<ProgressionProposalRecord> {
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
        if (proposal.status !== 'pending') throw new Error('Only pending proposals can be decided.');
        const now = this.now().toISOString();
        await this.db.progressionProposal.update(id, {status, decidedAt: now, updatedAt: now});
        return (await this.db.progressionProposal.get(id))!;
    }
}
