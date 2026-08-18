import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {ThemeProvider} from '@mui/material/styles';
import {maxGymTheme} from '../../theme/maxGymTheme';
import {MetricStepper, WorkoutProgressHeader} from './ActiveWorkoutUi';

function StepperFixture() {
    const [value, setValue] = useState('0');
    return <MetricStepper label="Load" value={value} unit="kg" step={0.5} onChange={setValue}/>;
}

function RepetitionStepperFixture() {
    const [value, setValue] = useState('8');
    return <MetricStepper label="Repetitions" value={value} unit="reps" step={1} onChange={setValue}/>;
}

describe('active workout UI', () => {
    it('lets a user replace zero directly and adjust the value with large named actions', () => {
        render(<ThemeProvider theme={maxGymTheme}><StepperFixture/></ThemeProvider>);
        const input = screen.getByRole('spinbutton', {name: 'Load'});
        fireEvent.change(input, {target: {value: ''}});
        expect(input).toHaveValue(null);
        fireEvent.change(input, {target: {value: '12'}});
        expect(input).toHaveValue(12);
        fireEvent.click(screen.getByRole('button', {name: 'Increase load'}));
        expect(input).toHaveValue(12.5);
        fireEvent.click(screen.getByRole('button', {name: 'Decrease load'}));
        expect(input).toHaveValue(12);
    });

    it('exposes workout state and the pause action without relying on colour', () => {
        render(<ThemeProvider theme={maxGymTheme}><WorkoutProgressHeader sessionName="Arms · 45 min" elapsed="12:42" completedSets={5} totalSets={15} paused={false} busy={false} onBack={() => undefined} onTogglePause={() => undefined}/></ThemeProvider>);
        expect(screen.getByText('5/15 sets completed')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Pause workout'})).toBeInTheDocument();
        expect(screen.getByRole('progressbar', {name: 'Workout progress'})).toHaveAttribute('aria-valuenow', '33');
    });

    it('records the exact repetitions performed even when they are below the target', () => {
        render(<ThemeProvider theme={maxGymTheme}><RepetitionStepperFixture/></ThemeProvider>);
        const input = screen.getByRole('spinbutton', {name: 'Repetitions'});
        fireEvent.click(screen.getByRole('button', {name: 'Decrease repetitions'}));
        expect(input).toHaveValue(7);
        fireEvent.change(input, {target: {value: '5'}});
        expect(input).toHaveValue(5);
        fireEvent.click(screen.getByRole('button', {name: 'Increase repetitions'}));
        expect(input).toHaveValue(6);
    });
});
