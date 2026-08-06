import {createTheme} from '@mui/material/styles';

export const maxGymTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {default: '#090D12', paper: '#101720'},
        primary: {main: '#53C7B7', contrastText: '#071412'},
        secondary: {main: '#7EA1F8'},
        success: {main: '#58D68D'},
        warning: {main: '#F4C95D'},
        error: {main: '#F27C8D'},
        info: {main: '#7EA1F8'},
        text: {primary: '#F2F6FA', secondary: '#A9B5C3'},
        divider: '#263342',
    },
    shape: {borderRadius: 16},
    typography: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        h4: {fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em'},
        h5: {fontSize: '1.35rem', fontWeight: 700},
        h6: {fontSize: '1.1rem', fontWeight: 700},
        button: {fontWeight: 700, textTransform: 'none'},
    },
    components: {
        MuiCssBaseline: {styleOverrides: {
            body: {backgroundColor: '#090D12', userSelect: 'auto'},
            '*:focus-visible': {outline: '3px solid #53C7B7', outlineOffset: '3px'},
            '@media (prefers-reduced-motion: reduce)': {'*': {animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important'}},
        }},
        MuiPaper: {styleOverrides: {root: {backgroundImage: 'none', border: '1px solid #263342'}}},
        MuiButton: {styleOverrides: {root: {minHeight: 48, borderRadius: 12}}},
        MuiIconButton: {styleOverrides: {root: {minWidth: 48, minHeight: 48}}},
        MuiCard: {styleOverrides: {root: {boxShadow: 'none', border: '1px solid #263342'}}},
    },
});
