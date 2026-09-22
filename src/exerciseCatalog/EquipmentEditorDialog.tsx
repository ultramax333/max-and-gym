import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, Typography} from '@mui/material';
import {PrimaryButton} from '../components/ui/UiPrimitives';
import {LibraryExercise} from './types';
import {useExerciseCatalog} from './useExerciseCatalog';
import {EquipmentStation, EQUIPMENT_STATIONS, requiredStations} from '../workout/equipmentStations';
import {recordDiagnostic} from '../diagnostics/service';

export function EquipmentEditorDialog({exercise, open, onClose, onSaved}: {exercise: LibraryExercise; open: boolean; onClose: () => void; onSaved: () => void | Promise<void>}) {
    const catalog = useExerciseCatalog();
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    const [error, setError] = useState<string>();
    const inferred = useMemo(() => requiredStations(exercise), [exercise]);
    const [stations, setStations] = useState<EquipmentStation[]>(inferred);
    const [primary, setPrimary] = useState<EquipmentStation>(exercise.primaryEquipmentStation ?? inferred[0] ?? 'other');
    const [difficulty, setDifficulty] = useState<'normal' | 'limited' | 'hard'>(exercise.accessDifficulty ?? 'normal');
    const [stationCount, setStationCount] = useState<1 | 2>(exercise.requiredStationCount ?? 1);
    useEffect(() => {
        if (!open) return;
        setError(undefined);
        const next = requiredStations(exercise);
        setStations(next);
        setPrimary(exercise.primaryEquipmentStation ?? next[0] ?? 'other');
        setDifficulty(exercise.accessDifficulty ?? 'normal');
        setStationCount(exercise.requiredStationCount ?? 1);
    }, [exercise, open]);
    const persist = async (reset: boolean) => {
        if (!catalog || savingRef.current || !stations.length) return;
        savingRef.current = true;
        setSaving(true);
        setError(undefined);
        try {
            if (reset) await catalog.resetEquipmentPreference(exercise.id);
            else await catalog.updatePreference(exercise.id, {
                requiredEquipmentStations: stations,
                primaryEquipmentStation: stations.includes(primary) ? primary : stations[0],
                accessDifficulty: difficulty,
                requiredStationCount: stationCount,
            });
            await onSaved();
            onClose();
        } catch {
            setError('Could not save equipment or refresh the display. Check free storage, then retry or reopen the exercise to verify your preferences.');
            recordDiagnostic({level: 'error', subsystem: 'UI', code: 'CATALOG_PREFERENCE_SAVE_FAILED', safeMessage: 'Equipment preference save failed.'});
        } finally { savingRef.current = false; setSaving(false); }
    };
    return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth><DialogTitle>Equipment and access</DialogTitle><DialogContent><Stack spacing={2} sx={{pt: 1}}>
        {error && <Alert severity="error">{error}</Alert>}<Box component="fieldset" disabled={saving} sx={{border: 0, p: 0, m: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2}}><Alert severity="info">Select every item required, including the resistance type (for example Dumbbells or Bodyweight). Supports alone retain the original resistance requirement. The primary item is used to group this exercise in a workout.</Alert>
        <FormControl fullWidth disabled={saving}><InputLabel id="required-equipment">Required equipment</InputLabel><Select labelId="required-equipment" multiple label="Required equipment" value={stations} renderValue={(selected) => selected.map((station) => EQUIPMENT_STATIONS[station].label).join(', ')} onChange={(event) => {
            const next = event.target.value as EquipmentStation[];
            if (!next.length) return;
            setStations(next);
            if (!next.includes(primary)) setPrimary(next[0]);
        }}>{Object.entries(EQUIPMENT_STATIONS).map(([id, details]) => <MenuItem key={id} value={id}><Checkbox checked={stations.includes(id as EquipmentStation)}/>{details.label}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth disabled={saving}><InputLabel id="primary-equipment">Primary grouping equipment</InputLabel><Select labelId="primary-equipment" label="Primary grouping equipment" value={primary} onChange={(event) => setPrimary(event.target.value as EquipmentStation)}>{stations.map((station) => <MenuItem key={station} value={station}>{EQUIPMENT_STATIONS[station].label}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth disabled={saving}><InputLabel id="access-difficulty">Access difficulty</InputLabel><Select labelId="access-difficulty" label="Access difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><MenuItem value="normal">Normal access</MenuItem><MenuItem value="limited">Often occupied</MenuItem><MenuItem value="hard">Hard to access at peak hours</MenuItem></Select></FormControl>
        <FormControl fullWidth disabled={saving}><InputLabel id="station-count">Stations needed at once</InputLabel><Select labelId="station-count" label="Stations needed at once" value={stationCount} onChange={(event) => setStationCount(Number(event.target.value) as 1 | 2)}><MenuItem value={1}>One station</MenuItem><MenuItem value={2}>Two stations</MenuItem></Select></FormControl>
        <Typography variant="body2" color="text.secondary">At busy times, exercises marked hard or needing two stations are moved down the generator ranking. They remain available if the session has no coherent alternative.</Typography>
    </Box></Stack></DialogContent><DialogActions sx={{flexDirection: 'column', gap: 1, p: 2}}><PrimaryButton fullWidth disabled={saving || !stations.length} onClick={() => void persist(false)}>{saving ? 'Saving…' : 'Save'}</PrimaryButton><Stack direction="row" justifyContent="space-between" width="100%"><Button color="inherit" disabled={saving} onClick={() => void persist(true)}>Restore catalogue defaults</Button><Button disabled={saving} onClick={onClose}>Cancel</Button></Stack></DialogActions></Dialog>;
}
