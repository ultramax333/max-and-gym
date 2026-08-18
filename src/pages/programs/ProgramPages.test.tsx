import 'fake-indexeddb/auto';
import React from 'react';
import Dexie from 'dexie';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {db} from '../../db/db';
import {ProgramRepository} from '../../programs/ProgramRepository';
import {ProgramDetailPage, ProgramListPage} from './ProgramPages';

describe('ProgramDetailPage', () => {
    beforeEach(async () => {
        db.close();
        await Dexie.delete('weightlog');
        await db.open();
    });

    afterEach(async () => {
        cleanup();
        await new Promise((resolve) => setTimeout(resolve, 0));
        db.close();
        await Dexie.delete('weightlog');
    });

    it('renders an empty two-day program with one page heading and clear actions', async () => {
        const program = await new ProgramRepository(db).create({name: 'Local strength', weeklyFrequency: 2, defaultDurationMinutes: 40});
        render(<MemoryRouter initialEntries={[`/programs/${program.id}`]}><Routes><Route path="/programs/:programId" element={<ProgramDetailPage/>}/></Routes></MemoryRouter>);
        expect(await screen.findByRole('heading', {level: 1, name: 'Local strength'})).toBeInTheDocument();
        expect(screen.getAllByRole('button', {name: /Add exercise/})).toHaveLength(2);
        expect(screen.getByRole('button', {name: 'Activate'})).toBeInTheDocument();
    });

    it('navigates from the creation dialog to the new builder without a route error', async () => {
        const user = userEvent;
        render(<MemoryRouter initialEntries={['/programs']}><Routes><Route path="/programs" element={<ProgramListPage/>}/><Route path="/programs/:programId" element={<ProgramDetailPage/>}/></Routes></MemoryRouter>);
        await user.click(await screen.findByRole('button', {name: 'Create program', exact: true}));
        const name = screen.getByRole('textbox', {name: 'Name'});
        await user.clear(name);
        await user.type(name, 'Test program');
        await user.click(screen.getByRole('dialog').querySelector('button:last-of-type')!);
        expect(await screen.findByRole('heading', {level: 1, name: 'Test program'})).toBeInTheDocument();
    });

    it('surfaces a saved one-day session and starts it without activating a weekly program', async () => {
        const repository = new ProgramRepository(db);
        const session = await repository.create({name: 'Saved glutes', weeklyFrequency: 1, defaultDurationMinutes: 45});
        await repository.addExercise({dayId: session.days[0].id, exerciseId: 'hip-thrust', exerciseName: 'Barbell Hip Thrust', movementPattern: 'hinge', primaryMuscles: ['glutes'], defaultRestSeconds: 90, defaultReps: {min: 8, max: 12}});
        render(<MemoryRouter initialEntries={['/programs?view=sessions']}><Routes><Route path="/programs" element={<ProgramListPage/>}/><Route path="/workout/active" element={<div>Saved session started</div>}/></Routes></MemoryRouter>);

        expect(await screen.findByRole('heading', {level: 2, name: 'Saved glutes'})).toBeInTheDocument();
        expect(screen.getByText('Reusable session')).toBeInTheDocument();
        expect(screen.queryByText('1 days/week')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', {name: 'Start'}));
        expect(await screen.findByText('Saved session started')).toBeInTheDocument();
        expect((await db.trainingProgram.get(session.id))?.status).toBe('draft');
    });
});
