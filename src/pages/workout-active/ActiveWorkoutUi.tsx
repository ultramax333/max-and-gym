import React, {ReactNode} from 'react';
import {Add, ArrowBack, Check, ChevronLeft, ChevronRight, Pause, PlayArrow, Remove, SkipNext} from '@mui/icons-material';
import {Box, Button, Chip, IconButton, LinearProgress, Paper, Stack, TextField, Typography} from '@mui/material';
import {ActiveWorkoutSnapshot, SessionExerciseRecord} from '../../workout/types';
import {equipmentStation, EQUIPMENT_STATIONS} from '../../workout/equipmentStations';

export function WorkoutProgressHeader({
    sessionName,
    elapsed,
    completedSets,
    totalSets,
    paused,
    busy,
    onBack,
    onTogglePause,
}: {
    sessionName: string;
    elapsed: string;
    completedSets: number;
    totalSets: number;
    paused: boolean;
    busy: boolean;
    onBack: () => void;
    onTogglePause: () => void;
}) {
    const progress = totalSets ? (completedSets / totalSets) * 100 : 0;
    return <Box component="header" sx={{position: 'sticky', top: 0, zIndex: 20, px: 2, pt: 'calc(8px + env(safe-area-inset-top))', pb: 1.25, bgcolor: 'rgba(9,13,18,.94)', backdropFilter: 'blur(16px)', borderBottom: '1px solid', borderColor: 'rgba(255,255,255,.06)'}}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton aria-label="Back to training" onClick={onBack}><ArrowBack/></IconButton>
            <Box sx={{textAlign: 'center', minWidth: 0, px: 1}}>
                <Typography sx={{fontSize: 13, lineHeight: 1.25, fontWeight: 850, color: 'primary.main', textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{sessionName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{fontVariantNumeric: 'tabular-nums'}}>{elapsed} elapsed</Typography>
            </Box>
            <IconButton aria-label={paused ? 'Resume workout' : 'Pause workout'} disabled={busy} onClick={onTogglePause}>{paused ? <PlayArrow/> : <Pause/>}</IconButton>
        </Stack>
        <Stack direction="row" alignItems="center" gap={1.25} sx={{mt: 0.75}}>
            <LinearProgress variant="determinate" value={progress} aria-label="Workout progress" sx={{flex: 1, height: 6, borderRadius: 99, bgcolor: 'rgba(255,255,255,.08)'}}/>
            <Typography variant="caption" sx={{fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{completedSets}/{totalSets} sets completed</Typography>
        </Stack>
    </Box>;
}

export function ExerciseRail({snapshot, currentExercise, busy, onSelect}: {
    snapshot: ActiveWorkoutSnapshot;
    currentExercise?: SessionExerciseRecord;
    busy: boolean;
    onSelect: (exercise: SessionExerciseRecord) => void;
}) {
    return <Stack component="nav" aria-label="Workout exercises" direction="row" gap={0.75} sx={{overflowX: 'auto', px: 2, pt: 2, pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': {display: 'none'}}}>
        {snapshot.exercises.map((exercise, index) => {
            const exerciseSets = snapshot.sets.filter((entry) => entry.sessionExerciseId === exercise.id);
            const completedSets = exerciseSets.filter((entry) => entry.status === 'completed').length;
            const complete = completedSets === exerciseSets.length;
            const current = exercise.id === currentExercise?.id;
            const station = EQUIPMENT_STATIONS[equipmentStation({exerciseId: exercise.exerciseId, equipmentTags: exercise.equipmentTagsSnapshot, equipmentStation: exercise.equipmentStationSnapshot})];
            return <Chip
                key={exercise.id}
                clickable={!current && !complete}
                disabled={busy || complete}
                onClick={() => !current && !complete && onSelect(exercise)}
                color={current ? 'primary' : complete ? 'success' : 'default'}
                variant={current ? 'filled' : 'outlined'}
                icon={complete ? <Check/> : undefined}
                label={`${index + 1}. ${exercise.exerciseNameSnapshot} · ${station.label}`}
                aria-current={current ? 'step' : undefined}
                sx={{flexShrink: 0, height: 48, borderBottom: `3px solid ${station.color}`, maxWidth: 245, '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}}}
            />;
        })}
    </Stack>;
}

function clampNumericValue(value: string, delta: number, step: number, maximum?: number): string {
    const parsed = Number(value);
    const base = Number.isFinite(parsed) ? parsed : 0;
    const next = Math.max(0, maximum === undefined ? base + (delta * step) : Math.min(maximum, base + (delta * step)));
    return String(Math.round(next * 10) / 10);
}

export function MetricStepper({label, value, unit, step, maximum, error, onChange}: {
    label: string;
    value: string;
    unit: string;
    step: number;
    maximum?: number;
    error?: boolean;
    onChange: (value: string) => void;
}) {
    return <Paper sx={{flex: 1, minWidth: 0, p: 1.25, bgcolor: '#111A24', borderColor: error ? 'error.main' : 'rgba(255,255,255,.08)'}}>
        <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'}>{label}</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5} sx={{mt: 0.5}}>
            <IconButton aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => onChange(clampNumericValue(value, -1, step, maximum))} sx={{bgcolor: 'rgba(255,255,255,.05)', flexShrink: 0, width: 48, height: 48}}><Remove fontSize="small"/></IconButton>
            <Box sx={{minWidth: 0, textAlign: 'center'}}>
                <TextField
                    variant="standard"
                    type="number"
                    value={value}
                    error={error}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) => onChange(event.target.value)}
                    inputProps={{'aria-label': label, inputMode: step < 1 ? 'decimal' : 'numeric', min: 0, max: maximum, step}}
                    sx={{width: {xs: 60, sm: 86}, '& .MuiInputBase-input': {p: 0, textAlign: 'center', fontSize: {xs: 27, sm: 30}, lineHeight: 1, fontWeight: 850, fontVariantNumeric: 'tabular-nums'}, '& .MuiInput-root:before, & .MuiInput-root:after': {display: 'none'}}}
                />
                <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>{unit}</Typography>
            </Box>
            <IconButton aria-label={`Increase ${label.toLowerCase()}`} onClick={() => onChange(clampNumericValue(value, 1, step, maximum))} sx={{bgcolor: 'rgba(83,199,183,.12)', color: 'primary.main', flexShrink: 0, width: 48, height: 48}}><Add fontSize="small"/></IconButton>
        </Stack>
    </Paper>;
}

export function WorkoutActionBar({children}: {children: ReactNode}) {
    return <Paper sx={{position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, borderRadius: '24px 24px 0 0', borderLeft: 0, borderRight: 0, borderBottom: 0, bgcolor: 'rgba(16,23,32,.97)', backdropFilter: 'blur(18px)', boxShadow: '0 -18px 50px rgba(0,0,0,.35)'}}>
        <Box sx={{width: '100%', maxWidth: 720, mx: 'auto', px: 2, pt: 1.5, pb: 'calc(14px + env(safe-area-inset-bottom))'}}>{children}</Box>
    </Paper>;
}

export function CompleteSetAction({busy, disabled, canGoPrevious, canGoNext, onPrevious, onComplete, onNext}: {
    busy: boolean;
    disabled: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onPrevious: () => void;
    onComplete: () => void;
    onNext: () => void;
}) {
    return <Stack direction="row" gap={1}>
        <IconButton aria-label="Previous exercise" disabled={busy || !canGoPrevious} onClick={onPrevious} sx={{border: '1px solid', borderColor: 'divider'}}><ChevronLeft/></IconButton>
        <Button fullWidth variant="contained" size="large" startIcon={<Check/>} disabled={busy || disabled} onClick={onComplete}>Complete set</Button>
        <IconButton aria-label="Next exercise" disabled={busy || !canGoNext} onClick={onNext} sx={{border: '1px solid', borderColor: 'divider'}}><ChevronRight/></IconButton>
    </Stack>;
}

export function RestAction({remaining, paused, busy, onAdjust, onTogglePause, onSkip}: {
    remaining: string;
    paused: boolean;
    busy: boolean;
    onAdjust: (seconds: number) => void;
    onTogglePause: () => void;
    onSkip: () => void;
}) {
    return <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Box>
            <Typography variant="caption" color="primary.main" fontWeight={800}>{paused ? 'REST PAUSED' : 'REST'}</Typography>
            <Typography sx={{fontSize: 28, lineHeight: 1, fontWeight: 850, fontVariantNumeric: 'tabular-nums'}}>{remaining}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={0.25}>
            <IconButton aria-label="Remove 15 seconds" disabled={busy} onClick={() => onAdjust(-15)}><Remove/></IconButton>
            <IconButton aria-label={paused ? 'Resume rest' : 'Pause rest'} disabled={busy} onClick={onTogglePause}>{paused ? <PlayArrow/> : <Pause/>}</IconButton>
            <IconButton aria-label="Add 15 seconds" disabled={busy} onClick={() => onAdjust(15)}><Add/></IconButton>
            <Button startIcon={<SkipNext/>} disabled={busy} onClick={onSkip}>Skip</Button>
        </Stack>
    </Stack>;
}
