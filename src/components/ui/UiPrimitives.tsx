import React, {ReactNode} from 'react';
import {Box, Button, Paper, Stack, Typography} from '@mui/material';
import {ArrowDownward, ArrowUpward, Inbox} from '@mui/icons-material';

export function ScreenContainer({children}: {children: ReactNode}) {
    return <Box sx={{width: '100%', maxWidth: 1120, mx: 'auto', px: {xs: 2.5, sm: 3, lg: 4}, py: {xs: 3, sm: 4}, pb: {xs: 'calc(112px + env(safe-area-inset-bottom))', md: 5}}}>{children}</Box>;
}

export function SectionHeader({eyebrow, title, action}: {eyebrow?: string; title: string; action?: ReactNode}) {
    return <Stack direction={{xs: 'column', sm: 'row'}} justifyContent="space-between" alignItems={{xs: 'stretch', sm: 'flex-end'}} gap={1.5} sx={{mb: 3.5}}><Box sx={{minWidth: 0}}>{eyebrow && <Typography variant="overline" color="text.secondary" sx={{display: 'block', mb: 1, fontSize: 11, letterSpacing: '.16em'}}>{eyebrow}</Typography>}<Typography component="h1" variant="h4">{title}</Typography></Box>{action && <Box sx={{flexShrink: 0}}>{action}</Box>}</Stack>;
}

export function StatePanel({title, description, action, icon = <Inbox/>}: {title: string; description: string; action?: ReactNode; icon?: ReactNode}) {
    return <Paper sx={{p: {xs: 3, sm: 4}, textAlign: 'center', borderStyle: 'solid', borderRadius: '24px', background: '#15181B'}}><Stack spacing={1.5} alignItems="center"><Box sx={{width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: '18px', color: 'primary.main', bgcolor: 'rgba(200,243,107,.12)', '& svg': {fontSize: 28}}}>{icon}</Box><Typography component="h2" variant="h6">{title}</Typography><Typography color="text.secondary" sx={{maxWidth: 440}}>{description}</Typography>{action && <Box sx={{pt: 0.5}}>{action}</Box>}</Stack></Paper>;
}

export function PrimaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} variant="contained" color="primary"/>; }
export function SecondaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} variant="outlined" color="primary"/>; }

export function ReorderControls({onMoveUp, onMoveDown}: {onMoveUp: () => void; onMoveDown: () => void}) {
    return <Stack direction="row" gap={1}><Button aria-label="Move up" onClick={onMoveUp} startIcon={<ArrowUpward/>}>Up</Button><Button aria-label="Move down" onClick={onMoveDown} startIcon={<ArrowDownward/>}>Down</Button></Stack>;
}
