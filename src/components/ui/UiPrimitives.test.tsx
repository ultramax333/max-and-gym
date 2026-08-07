import React from 'react';
import {render, screen} from '@testing-library/react';
import {ThemeProvider} from '@mui/material/styles';
import {ReorderControls, SectionHeader} from './UiPrimitives';
import {maxGymTheme} from '../../theme/maxGymTheme';

describe('UI primitives', () => {
    it('exposes one semantic page heading and accessible reorder actions', () => {
        render(<ThemeProvider theme={maxGymTheme}><SectionHeader title="Program"/><ReorderControls onMoveUp={() => undefined} onMoveDown={() => undefined}/></ThemeProvider>);
        expect(screen.getByRole('heading', {level: 1, name: 'Program'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Move up'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Move down'})).toBeInTheDocument();
    });
});
