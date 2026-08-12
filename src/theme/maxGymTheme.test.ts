import {maxGymTheme} from './maxGymTheme';

describe('maxGymTheme', () => {
    it('keeps the shell in the documented dark palette', () => {
        expect(maxGymTheme.palette.mode).toBe('dark');
        expect(maxGymTheme.palette.background.default).toBe('#090D12');
        expect(maxGymTheme.palette.primary.main).toBe('#53C7B7');
        expect(maxGymTheme.components?.MuiButton?.styleOverrides?.root).toMatchObject({minHeight: 48, borderRadius: 12});
        expect(maxGymTheme.components?.MuiIconButton?.styleOverrides?.root).toMatchObject({minWidth: 48, minHeight: 48});
        expect(maxGymTheme.components?.MuiCard?.styleOverrides?.root).toMatchObject({borderRadius: 20});
        expect(maxGymTheme.components?.MuiOutlinedInput?.styleOverrides?.root).toMatchObject({minHeight: 52, borderRadius: 14});
    });
});
