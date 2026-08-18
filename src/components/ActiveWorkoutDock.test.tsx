import 'fake-indexeddb/auto';
import React from 'react';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import {ActiveWorkoutDock} from './ActiveWorkoutDock';
import {db} from '../db/db';
import {diagnosticsDb} from '../diagnostics/database';
import {DexieWorkoutRepository} from '../workout/DexieWorkoutRepository';
import {maxGymTheme} from '../theme/maxGymTheme';

describe('ActiveWorkoutDock', () => {
    beforeEach(async () => {
        localStorage.setItem('userName', 'Default User');
        db.close();
        await Dexie.delete('weightlog');
        await diagnosticsDb.operations.clear();
        await db.open();
    });

    afterEach(async () => {
        cleanup();
        await new Promise((resolve) => setTimeout(resolve, 0));
        db.close();
        await Dexie.delete('weightlog');
        localStorage.clear();
    });

    it('resumes the active workout and finishes it only after confirmation', async () => {
        const repository = new DexieWorkoutRepository(db);
        const started = await repository.startSample('dock-active');
        render(<ThemeProvider theme={maxGymTheme}><MemoryRouter initialEntries={['/programs']}><Routes><Route path="/programs" element={<><div>Programs route</div><ActiveWorkoutDock navigationVisible/></>}/><Route path="/workout/active" element={<div>Active workout route</div>}/><Route path="/workout/summary/:sessionId" element={<div>Workout summary route</div>}/></Routes></MemoryRouter></ThemeProvider>);

        expect(await screen.findByRole('complementary', {name: 'Active workout controls'})).toHaveTextContent('0/6 sets completed');
        await userEvent.click(screen.getByRole('button', {name: 'Finish active workout'}));
        const dialog = screen.getByRole('dialog', {name: 'Finish this workout?'});
        expect((await db.workoutSession.get(started.session.id))?.status).toBe('active');
        await userEvent.click(within(dialog).getByRole('button', {name: 'Finish workout'}));

        expect(await screen.findByText('Workout summary route')).toBeInTheDocument();
        await waitFor(async () => expect((await db.workoutSession.get(started.session.id))?.status).toBe('completed'));
    });
});
