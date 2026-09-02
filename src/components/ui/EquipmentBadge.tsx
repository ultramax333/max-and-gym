import React from 'react';
import {Chip, Stack} from '@mui/material';
import {EquipmentExercise, EquipmentStation, EQUIPMENT_STATIONS, requiredStations} from '../../workout/equipmentStations';

export function EquipmentBadge({station}: {station: EquipmentStation}) {
    const {label, color} = EQUIPMENT_STATIONS[station];
    return <Chip size="small" label={label} variant="outlined" sx={{color, borderColor: color, bgcolor: '#101720', fontWeight: 700}}/>;
}

export function EquipmentBadges({exercise}: {exercise: EquipmentExercise}) {
    return <Stack direction="row" gap={0.75} flexWrap="wrap">{requiredStations(exercise).map((station) => <EquipmentBadge key={station} station={station}/>)}</Stack>;
}
