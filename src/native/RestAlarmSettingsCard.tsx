import React, {useEffect, useState} from 'react';
import {Alert, Button, FormControl, FormControlLabel, InputLabel, MenuItem, Paper, Select, Stack, Switch, Typography} from '@mui/material';
import {DEFAULT_REST_ALARM_PREFERENCES, RestAlarmGateway, RestAlarmPreferences, restAlarmGateway} from './restAlarmGateway';
import {recordDiagnostic} from '../diagnostics/service';

export interface RestAlarmSettingsCardProps {
    gateway?: RestAlarmGateway;
}

export function RestAlarmSettingsCard({gateway = restAlarmGateway}: RestAlarmSettingsCardProps) {
    const [preferences, setPreferences] = useState<RestAlarmPreferences>(DEFAULT_REST_ALARM_PREFERENCES);
    const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
    const nativeAndroid = gateway.isNativeAndroid();

    useEffect(() => {
        if (!nativeAndroid) {
            setStatus('ready');
            return;
        }
        let active = true;
        void gateway.getPreferences().then((value) => {
            if (active) {
                setPreferences(value);
                setStatus('ready');
            }
        }).catch((error: unknown) => {
            recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Native alarm preferences could not be loaded.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            if (active) setStatus('error');
        });
        return () => { active = false; };
    }, [gateway, nativeAndroid]);

    const save = async () => {
        setStatus('saving');
        try {
            setPreferences(await gateway.setPreferences(preferences));
            setStatus('saved');
        } catch (error) {
            recordDiagnostic({level: 'warning', subsystem: 'TIMER', code: 'TIMER_SIGNAL_UNAVAILABLE', safeMessage: 'Native alarm preferences could not be saved.', context: {errorClass: error instanceof Error ? error.name : 'UnknownError'}});
            setStatus('error');
        }
    };

    if (!nativeAndroid) return <Alert severity="info">These alarm controls are available in the Android app. Browser rest alerts keep their existing behavior.</Alert>;

    return <Paper component="section" aria-labelledby="rest-alarm-settings-title" sx={{p: 2}}>
        <Stack spacing={2}>
            <div>
                <Typography id="rest-alarm-settings-title" component="h2" variant="h6">Rest alarm</Typography>
                <Typography color="text.secondary">Choose how the native Android alert behaves when a rest timer ends.</Typography>
            </div>
            {status === 'error' && <Alert severity="error">Alarm preferences could not be saved. Your previous settings remain active.</Alert>}
            {status === 'saved' && <Alert severity="success">Alarm preferences saved locally.</Alert>}
            <FormControl fullWidth disabled={status === 'loading' || status === 'saving'}>
                <InputLabel id="rest-alarm-duration-label">Ring duration</InputLabel>
                <Select labelId="rest-alarm-duration-label" label="Ring duration" value={preferences.durationSeconds} onChange={(event) => setPreferences((current) => ({...current, durationSeconds: Number(event.target.value) as RestAlarmPreferences['durationSeconds']}))}>
                    <MenuItem value={5}>5 seconds</MenuItem><MenuItem value={10}>10 seconds</MenuItem><MenuItem value={20}>20 seconds</MenuItem><MenuItem value={30}>30 seconds</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth disabled={status === 'loading' || status === 'saving'}>
                <InputLabel id="rest-alarm-tone-label">Tone</InputLabel>
                <Select labelId="rest-alarm-tone-label" label="Tone" value={preferences.tone} onChange={(event) => setPreferences((current) => ({...current, tone: event.target.value as RestAlarmPreferences['tone']}))}>
                    <MenuItem value="classic">Classic beep</MenuItem><MenuItem value="urgent">Urgent alert</MenuItem><MenuItem value="silent">Silent</MenuItem>
                </Select>
            </FormControl>
            <FormControlLabel control={<Switch checked={preferences.vibrationEnabled} onChange={(event) => setPreferences((current) => ({...current, vibrationEnabled: event.target.checked}))}/>} label="Vibration"/>
            <Typography variant="body2" color="text.secondary">When an alarm rings, its notification includes Stop and +30 s actions. +30 s safely re-arms the same timer generation.</Typography>
            <Button variant="contained" onClick={() => void save()} disabled={status === 'loading' || status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save alarm settings'}</Button>
        </Stack>
    </Paper>;
}
