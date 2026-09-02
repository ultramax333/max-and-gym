import React from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import {maxGymTheme} from '../../theme/maxGymTheme';
import {WorkoutSetupPage} from './WorkoutSetupPage';
import {StartWorkoutInput} from '../../workout/types';

const mocks = vi.hoisted(() => ({start: vi.fn(), list: vi.fn(), abandon: vi.fn(), findActive: vi.fn()}));
vi.mock('../../components/layout', () => ({default: ({children}: {children: React.ReactNode}) => <main>{children}</main>}));
vi.mock('../../workout/useWorkoutService', () => ({useWorkoutService: () => ({startProgramDay: mocks.start, abandon: mocks.abandon, findActive: mocks.findActive})}));
vi.mock('../../exerciseCatalog/ExerciseCatalogRepository', () => ({ExerciseCatalogRepository: class {list = mocks.list;}}));
vi.mock('../../db/db', () => ({db: {}}));
vi.mock('../../diagnostics/service', () => ({recordDiagnostic: vi.fn()}));

const prescription = {prescriptionSnapshot: '3 × 8–12 · rest 90 s', workingSets: 3, repsMin: 8, repsMax: 12, targetLoadKg: 12, targetRir: 2, restSeconds: 90};
const input: StartWorkoutInput = {name: 'Anonymous session', plannedDurationSeconds: 2400, exercises: [
    {...prescription, exerciseId: 'curl', exerciseName: 'Curl'},
    {...prescription, exerciseId: 'fedb:Dumbbell_Bench_Press', exerciseName: 'Bench press'},
]};
function mount(workoutInput: StartWorkoutInput | undefined = input, replaceSessionId?: string) {
    return render(<ThemeProvider theme={maxGymTheme}><MemoryRouter initialEntries={[{pathname: '/workout/setup', state: {workoutInput, replaceSessionId}}]}><Routes><Route path="/workout/setup" element={<WorkoutSetupPage/>}/><Route path="/workout/active" element={<p>Training started</p>}/></Routes></MemoryRouter></ThemeProvider>);
}
beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue(input.exercises.map((exercise) => ({id: exercise.exerciseId, equipmentTags: ['dumbbell']})));
    mocks.start.mockResolvedValue({});
    mocks.findActive.mockResolvedValue(undefined);
});

describe('workout equipment setup', () => {
    it('waits for confirmation and starts the selected order with metadata and duration intact', async () => {
        mount();
        fireEvent.click(await screen.findByRole('button', {name: 'Move Bench earlier'}));
        const preview = within(screen.getByRole('list', {name: 'Ordered exercises'}));
        expect(preview.getAllByRole('listitem')[0]).toHaveTextContent('1. Bench press');
        expect(mocks.start).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Start workout'}));
        await screen.findByText('Training started');
        expect(mocks.start).toHaveBeenCalledTimes(1);
        const started = mocks.start.mock.calls[0][0] as StartWorkoutInput;
        expect(started.plannedDurationSeconds).toBe(2400);
        expect(started.exercises.map((exercise) => exercise.exerciseId)).toEqual(['fedb:Dumbbell_Bench_Press', 'curl']);
        expect(started.exercises[0]).toMatchObject({...prescription, equipmentStation: 'bench', equipmentTags: ['dumbbell']});
        expect(input.exercises[0].exerciseId).toBe('curl');
    });
    it('can keep the original exercise order', async () => {
        mount();
        fireEvent.click(await screen.findByRole('button', {name: 'Move Bench earlier'}));
        fireEvent.click(screen.getByRole('button', {name: 'Keep original exercise order'}));
        expect(within(screen.getByRole('list')).getAllByRole('listitem')[0]).toHaveTextContent('1. Curl');
    });
    it('does not stop the previous session before confirmation', async () => {
        mocks.findActive.mockResolvedValue({session: {id: 'old'}});
        mount(input, 'old');
        await screen.findByRole('button', {name: 'Start workout'});
        expect(mocks.abandon).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Start workout'}));
        await screen.findByText('Training started');
        expect(mocks.abandon).toHaveBeenCalledWith('old');
    });
    it('does not replace a different session started while setup was open', async () => {
        mocks.findActive.mockResolvedValue({session: {id: 'another-session'}});
        mount(input, 'old');
        fireEvent.click(await screen.findByRole('button', {name: 'Start workout'}));
        await screen.findByText(/WORKOUT_START_FAILED/);
        expect(mocks.abandon).not.toHaveBeenCalled();
        expect(mocks.start).not.toHaveBeenCalled();
    });
    it('guards double taps and retains the operation ID for retries', async () => {
        let rejectStart: (error: Error) => void = () => undefined;
        mocks.start.mockImplementationOnce(() => new Promise((_, reject) => { rejectStart = reject; }));
        mount();
        const button = await screen.findByRole('button', {name: 'Start workout'});
        fireEvent.click(button);
        fireEvent.click(button);
        expect(mocks.start).toHaveBeenCalledTimes(1);
        rejectStart(new Error('write failed'));
        await screen.findByText(/WORKOUT_START_FAILED/);
        fireEvent.click(screen.getByRole('button', {name: 'Start workout'}));
        await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(2));
        expect(mocks.start.mock.calls[0][1]).toBe(mocks.start.mock.calls[1][1]);
    });
});
