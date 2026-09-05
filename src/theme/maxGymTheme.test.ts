import {maxGymTheme} from './maxGymTheme';

describe('maxGymTheme', () => {
    it('keeps the shell in the documented dark palette', () => {
        expect(maxGymTheme.palette.mode).toBe('dark');
        expect(maxGymTheme.palette.background.default).toBe('#0C0E10');
        expect(maxGymTheme.palette.primary.main).toBe('#C8F36B');
        expect(maxGymTheme.components?.MuiButton?.styleOverrides?.root).toMatchObject({minHeight: 48, borderRadius: 14});
        expect(maxGymTheme.components?.MuiIconButton?.styleOverrides?.root).toMatchObject({minWidth: 48, minHeight: 48});
        expect(maxGymTheme.components?.MuiCard?.styleOverrides?.root).toMatchObject({borderRadius: 24});
        expect(maxGymTheme.components?.MuiOutlinedInput?.styleOverrides?.root).toMatchObject({minHeight: 52, borderRadius: 14});
    });
});
