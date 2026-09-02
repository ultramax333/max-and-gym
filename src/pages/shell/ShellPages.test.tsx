import 'fake-indexeddb/auto';
import React from 'react';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ThemeProvider} from '@mui/material/styles';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {db} from '../../db/db';
import {diagnosticsDb} from '../../diagnostics/database';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {DexieWorkoutRepository} from '../../workout/DexieWorkoutRepository';
import {maxGymTheme} from '../../theme/maxGymTheme';
import {HomeShellPage} from './ShellPages';
import {DBContext} from '../../context/dbContext';
import {WorkoutSetupPage} from '../workout-active/WorkoutSetupPage';

function renderHome() {
    return render(<ThemeProvider theme={maxGymTheme}><DBContext.Provider value={{db}}><MemoryRouter initialEntries={['/']}><Routes><Route path="/" element={<HomeShellPage/>}/><Route path="/workout/setup" element={<WorkoutSetupPage/>}/><Route path="/workout/active" element={<div>Active workout route</div>}/></Routes></MemoryRouter></DBContext.Provider></ThemeProvider>);
}

async function createActiveProgram() {
    const programs = new ProgramRepository(db);
    const program = await programs.create({name: 'Local strength', weeklyFrequency: 1, defaultDurationMinutes: 40});
    await programs.addExercise({dayId: program.days[0].id, exerciseId: 'curl', exerciseName: 'Dumbbell curl', movementPattern: 'elbow-flexion', primaryMuscles: ['biceps'], defaultRestSeconds: 60, defaultReps: {min: 8, max: 12}});
    return programs.activate(program.id);
}

describe('Home workout controls', () => {
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

    it('shows Resume and a confirmed Stop action for the active workout', async () => {
        const repository = new DexieWorkoutRepository(db);
        await repository.startSample('home-active');
        renderHome();

        expect(await screen.findByRole('button', {name: 'Resume workout'})).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', {name: 'Stop workout'}));
        const dialog = screen.getByRole('dialog', {name: 'Stop this workout?'});
        await userEvent.click(within(dialog).getByRole('button', {name: 'Stop workout'}));

        await waitFor(async () => expect(await repository.findActive()).toBeUndefined());
        expect(await screen.findByText('No workout planned')).toBeInTheDocument();
    });

    it('replaces an existing workout only after confirmation and starts the selected program', async () => {
        const repository = new DexieWorkoutRepository(db);
        await createActiveProgram();
        await repository.startSample('home-conflict');
        renderHome();

        const plannedCard = await screen.findByRole('button', {name: /Local strength · Day A/});
        await userEvent.click(plannedCard);
        const dialog = screen.getByRole('dialog', {name: 'Start the planned workout?'});
        await userEvent.click(within(dialog).getByRole('button', {name: 'Replace and start'}));

        await screen.findByRole('heading', {name: 'Equipment order'});
        expect((await repository.findActive())?.session.nameSnapshot).toBe('Essential workout');
        await userEvent.click(await screen.findByRole('button', {name: 'Start workout'}));
        expect(await screen.findByText('Active workout route')).toBeInTheDocument();
        await waitFor(async () => expect((await repository.findActive())?.session.nameSnapshot).toBe('Local strength · Day A'));
    });
});
