import {ProgressionKind, ProgressionProposal, ProgressionStatus} from '../generator/progression';

export interface ProgressionProposalRecord extends ProgressionProposal {
    id: string;
    sessionId: string;
    programId: string;
    programExerciseId: string;
    prescriptionId: string;
    status: ProgressionStatus;
    updatedAt: string;
    decidedAt?: string;
}
