import React from 'react';
import {Chip, Stack} from '@mui/material';
import {equipmentStation, EquipmentExercise, EquipmentStation, EQUIPMENT_STATIONS, requiredStations} from '../../workout/equipmentStations';

export function EquipmentBadge({station, primary = false}: {station: EquipmentStation; primary?: boolean}) {
    const {label, color} = EQUIPMENT_STATIONS[station];
    return <Chip size="small" label={`${primary ? '★ ' : ''}${label}`} variant="outlined" sx={{color, borderColor: color, bgcolor: '#15181B', fontWeight: 700}}/>;
}

export function EquipmentBadges({exercise}: {exercise: EquipmentExercise}) {
    const primary = equipmentStation(exercise);
    return <Stack direction="row" gap={0.75} flexWrap="wrap">{requiredStations(exercise).map((station) => <EquipmentBadge key={station} station={station} primary={station === primary}/>)}</Stack>;
}
