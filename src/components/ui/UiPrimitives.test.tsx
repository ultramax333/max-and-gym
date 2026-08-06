import React from 'react';
import {render, screen} from '@testing-library/react';
import {ThemeProvider} from '@mui/material/styles';
import {ReorderControls, SectionHeader} from './UiPrimitives';
import {maxGymTheme} from '../../theme/maxGymTheme';

describe('UI primitives', () => {
    it('exposes one semantic page heading and accessible reorder actions', () => {
        render(<ThemeProvider theme={maxGymTheme}><SectionHeader title="Programme"/><ReorderControls onMoveUp={() => undefined} onMoveDown={() => undefined}/></ThemeProvider>);
        expect(screen.getByRole('heading', {level: 1, name: 'Programme'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Déplacer vers le haut'})).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Déplacer vers le bas'})).toBeInTheDocument();
    });
});
