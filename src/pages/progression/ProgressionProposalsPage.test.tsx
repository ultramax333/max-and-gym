import 'fake-indexeddb/auto';
import React from 'react';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeProvider} from '@mui/material/styles';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {DBContext} from '../../context/dbContext';
import {db} from '../../db/db';
import {maxGymTheme} from '../../theme/maxGymTheme';
import {ProgressionProposalsPage} from './ProgressionProposalsPage';

describe('next-session defaults page', () => {
    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        db.close();
        await Dexie.delete('weightlog');
        await db.open();
        await db.trainingProgram.add({id: 'program', name: 'Arms 45', description: '', source: 'manual', status: 'active', weeklyFrequency: 1, defaultDurationMinutes: 45, currentDayIndex: 0, createdAt: '2026-09-17T10:00:00Z', updatedAt: '2026-09-17T10:00:00Z'});
        await db.exercisePrescription.add({id: 'rx', workingSets: 3, repsMin: 8, repsMax: 12, targetRir: 2, restSeconds: 90, loadReferenceKg: 12});
        await db.programExercise.add({id: 'program-exercise', programDayId: 'day', exerciseId: 'curl', exerciseNameSnapshot: 'Dumbbell curl', movementPatternSnapshot: 'elbow-flexion', primaryMusclesSnapshot: ['biceps'], sequenceIndex: 0, role: 'accessory', groupType: 'single', groupSequenceIndex: 0, locked: false, alternativeExerciseIds: [], prescriptionId: 'rx', progressionRuleId: 'rule', notes: ''});
        await db.sessionExercise.add({id: 'session-exercise', sessionId: 'session', exerciseId: 'curl', exerciseNameSnapshot: 'Dumbbell curl', prescriptionSnapshot: '{}', programExerciseId: 'program-exercise', lockedSnapshot: false, alternativeExerciseIdsSnapshot: [], sequenceIndex: 0, status: 'completed', createdAt: '2026-09-17T10:00:00Z', updatedAt: '2026-09-17T10:00:00Z'});
        const set = {sessionId: 'session', sessionExerciseId: 'session-exercise', setKind: 'working' as const, targetRepsMin: 8, targetRepsMax: 12, targetLoadKg: 12, targetRir: 2, restSeconds: 90, status: 'completed' as const, actualLoadKg: 12, actualReps: 12, actualRir: 2, createdAt: '2026-09-17T10:00:00Z', updatedAt: '2026-09-17T10:00:00Z'};
        await db.performedSet.bulkAdd([{...set, id: 'set-1', sequenceIndex: 0}, {...set, id: 'set-2', sequenceIndex: 1}, {...set, id: 'set-3', sequenceIndex: 2}]);
        await db.progressionProposal.add({id: 'proposal', sessionId: 'session', programId: 'program', programExerciseId: 'program-exercise', prescriptionId: 'rx', exerciseId: 'curl', kind: 'double-progression', status: 'pending', proposedLoadKg: 14.5, reasonCode: 'SUCCESS_INCREASE', reason: 'Top of range reached.', requiresConfirmation: true, createdAt: '2026-09-17T10:00:00Z', updatedAt: '2026-09-17T10:00:00Z'});
    });

    afterEach(async () => {
        cleanup();
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('separates history, ratings and optional program defaults, then applies only on confirmation', async () => {
        render(<ThemeProvider theme={maxGymTheme}><DBContext.Provider value={{db}}><MemoryRouter initialEntries={['/progress/proposals?session=session']}><Routes><Route path="/progress/proposals" element={<ProgressionProposalsPage/>}/></Routes></MemoryRouter></DBContext.Provider></ThemeProvider>);

        expect(await screen.findByRole('heading', {name: 'Defaults for next time'})).toBeInTheDocument();
        expect(screen.getByText('Exercise rating (1–5)')).toBeInTheDocument();
        expect(await screen.findByText('12 kg → 14.5 kg suggested')).toBeInTheDocument();
        expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(12);

        await userEvent.click(screen.getByRole('button', {name: 'Apply 14.5 kg next time'}));

        await waitFor(async () => expect((await db.exercisePrescription.get('rx'))?.loadReferenceKg).toBe(14.5));
        expect(await screen.findByText('Default applied')).toBeInTheDocument();
        expect(screen.getByText('14.5 kg saved as the default')).toBeInTheDocument();
    });
});
