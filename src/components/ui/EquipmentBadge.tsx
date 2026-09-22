import React from 'react';
import {Chip, Stack, Tooltip} from '@mui/material';
import {Star} from '@mui/icons-material';
import {equipmentStation, EquipmentExercise, EquipmentStation, EQUIPMENT_STATIONS, requiredStations} from '../../workout/equipmentStations';

export function EquipmentBadge({station, primary = false}: {station: EquipmentStation; primary?: boolean}) {
    const {label, color} = EQUIPMENT_STATIONS[station];
    return <Tooltip title={primary ? 'Primary equipment for workout grouping' : 'Also required'}><Chip size="small" label={label} aria-label={`${label}${primary ? ' · primary grouping equipment' : ''}`} icon={primary ? <Star aria-hidden="true"/> : undefined} variant="outlined" sx={{color, borderColor: color, bgcolor: '#15181B', fontWeight: 700, '& .MuiChip-icon': {color, fontSize: 16}}}/></Tooltip>;
}

export function EquipmentBadges({exercise}: {exercise: EquipmentExercise}) {
    const primary = equipmentStation(exercise);
    return <Stack direction="row" gap={0.75} flexWrap="wrap">{requiredStations(exercise).map((station) => <EquipmentBadge key={station} station={station} primary={station === primary}/>)}</Stack>;
}
