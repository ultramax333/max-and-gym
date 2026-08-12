import React, {useState} from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {ThemeProvider} from '@mui/material/styles';
import {maxGymTheme} from '../../theme/maxGymTheme';
import {MetricStepper, WorkoutProgressHeader} from './ActiveWorkoutUi';

function StepperFixture() {
    const [value, setValue] = useState('0');
    return <MetricStepper label="Load" value={value} unit="kg" step={0.5} onChange={setValue}/>;
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
});
