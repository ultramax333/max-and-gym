import React, {ErrorInfo, ReactNode} from 'react';
import {AppBar, Box, Button, CssBaseline, Stack, Toolbar, Typography} from '@mui/material';
import {ContentCopy, Report} from '@mui/icons-material';
import {DiagnosticSubsystem, ErrorCode} from '../diagnostics/types';
import {recordException} from '../diagnostics/service';
import {buildIdentity} from '../config/buildIdentity';

interface Props {
    children: ReactNode;
    code?: ErrorCode;
    subsystem?: DiagnosticSubsystem;
}

interface State {
    hasError: boolean;
    errorId?: string;
}

class ErrorBoundary extends React.Component<Props, State> {
    state: State = {hasError: false};

    static getDerivedStateFromError(): State {
        return {hasError: true};
    }

    componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
        const errorId = recordException(
            error,
            this.props.code ?? 'BOOT_UNHANDLED_ERROR',
            this.props.subsystem ?? 'BOOT',
            'A protected application area could not be displayed.',
        );
        this.setState({hasError: true, errorId});
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        const errorId = this.state.errorId ?? 'pending';
        return <>
            <CssBaseline/>
            <AppBar position="fixed" color="error">
                <Toolbar><Typography variant="h6">Max &amp; Gym — protected error</Typography></Toolbar>
            </AppBar>
            <Stack spacing={2} sx={{p: 3, minHeight: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: '#121212', color: 'white'}}>
                <Report color="error" sx={{fontSize: 80}}/>
                <Typography variant="h5" textAlign="center">This area encountered an error.</Typography>
                <Typography textAlign="center">Your data remains on this device. Use this identifier in Diagnostics.</Typography>
                <Box sx={{p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, fontFamily: 'monospace'}}>{errorId}</Box>
                <Typography variant="caption">Build {buildIdentity.buildId}</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                    <Button variant="outlined" startIcon={<ContentCopy/>} onClick={() => void navigator.clipboard?.writeText(errorId)}>Copy ID</Button>
                    <Button variant="contained" onClick={() => window.location.reload()}>Reload</Button>
                    <Button variant="outlined" onClick={() => { window.location.hash = '#/diagnostics'; window.location.reload(); }}>Diagnostics</Button>
                </Stack>
            </Stack>
        </>;
    }
}

export default ErrorBoundary;
