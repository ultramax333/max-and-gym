import React, {ReactNode} from 'react';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {ArrowDownward, ArrowUpward, Inbox} from '@mui/icons-material';

export function ScreenContainer({children}: {children: ReactNode}) {
    return <Box sx={{width: '100%', maxWidth: 1100, mx: 'auto', px: {xs: 2, sm: 3}, py: {xs: 2, sm: 3}, pb: {xs: 'calc(96px + env(safe-area-inset-bottom))', md: 4}}}>{children}</Box>;
}

export function SectionHeader({eyebrow, title, action}: {eyebrow?: string; title: string; action?: ReactNode}) {
    return <Stack direction="row" justifyContent="space-between" alignItems="end" gap={2} sx={{mb: 2}}><Box>{eyebrow && <Typography variant="overline" color="primary.main">{eyebrow}</Typography>}<Typography component="h1" variant="h4">{title}</Typography></Box>{action}</Stack>;
}

export function StatePanel({title, description, action, icon = <Inbox/>}: {title: string; description: string; action?: ReactNode; icon?: ReactNode}) {
    return <Paper sx={{p: 3, textAlign: 'center', borderStyle: 'dashed'}}><Stack spacing={1.5} alignItems="center"><Box sx={{color: 'primary.main'}}>{icon}</Box><Typography component="h2" variant="h6">{title}</Typography><Typography color="text.secondary" sx={{maxWidth: 440}}>{description}</Typography>{action}</Stack></Paper>;
}

export function PrimaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} variant="contained" color="primary"/>; }
export function SecondaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} variant="outlined" color="primary"/>; }

export function ReorderControls({onMoveUp, onMoveDown}: {onMoveUp: () => void; onMoveDown: () => void}) {
    return <Stack direction="row" gap={1}><Button aria-label="Déplacer vers le haut" onClick={onMoveUp} startIcon={<ArrowUpward/>}>Monter</Button><Button aria-label="Déplacer vers le bas" onClick={onMoveDown} startIcon={<ArrowDownward/>}>Descendre</Button></Stack>;
}
