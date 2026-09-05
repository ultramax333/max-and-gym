import React from 'react';
import {Box, BottomNavigation, BottomNavigationAction, Paper, Tooltip, Typography} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import {CalendarMonth, FitnessCenter, HomeRounded, Timeline, ViewModule} from '@mui/icons-material';

const items = [
    {path: '/', label: 'Home', icon: <HomeRounded/>},
    {path: '/train', label: 'Train', icon: <FitnessCenter/>},
    {path: '/programs', label: 'Programs', icon: <CalendarMonth/>},
    {path: '/progress', label: 'Progress', icon: <Timeline/>},
    {path: '/library', label: 'Library', icon: <ViewModule/>},
];

function currentIndex(pathname: string): number {
    if (pathname.startsWith('/exercises') || pathname.startsWith('/library')) return 4;
    const found = items.findIndex((item) => item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path)));
    return found < 0 ? 0 : found;
}

export const WLNav = ({desktop = false}: {desktop?: boolean}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const selected = currentIndex(location.pathname);
    if (desktop) return <Paper component="nav" aria-label="Primary navigation" sx={{display: {xs: 'none', md: 'flex'}, position: 'fixed', zIndex: 1200, left: 0, top: 0, bottom: 0, width: 88, borderRadius: 0, border: 0, borderRight: '1px solid', borderColor: 'divider', alignItems: 'center', flexDirection: 'column', pt: 20, pb: 2, gap: 1, bgcolor: 'rgba(21,24,27,.92)', backdropFilter: 'blur(18px)'}}><Box sx={{position: 'absolute', top: 90, width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: '18px', bgcolor: 'rgba(200,243,107,.12)', border: '1px solid rgba(200,243,107,.22)'}}><Typography aria-label="Max and Gym" fontWeight={900} color="primary.main">M&G</Typography></Box>{items.map((item, index) => <Tooltip key={item.path} title={item.label} placement="right"><BottomNavigationAction aria-label={item.label} aria-current={index === selected ? 'page' : undefined} label={item.label} icon={item.icon} showLabel onClick={() => navigate(item.path)} sx={{width: 72, minWidth: 72, minHeight: 64, height: 72, flex: '0 0 auto', borderRadius: '18px', color: index === selected ? 'primary.main' : 'text.secondary', ...(index === selected ? {bgcolor: 'rgba(200,243,107,.14)', border: '1px solid rgba(200,243,107,.18)'} : {})}}/></Tooltip>)}</Paper>;
    return <Box component="nav" aria-label="Primary navigation" sx={{display: {xs: 'block', md: 'none'}, position: 'fixed', zIndex: 1200, left: 12, right: 12, bottom: 'calc(10px + env(safe-area-inset-bottom))', px: 0.75, pt: 0, pb: 0, bgcolor: 'rgba(21,24,27,.94)', backdropFilter: 'blur(18px)', border: '1px solid', borderColor: 'divider', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,.45)'}}><BottomNavigation value={selected} showLabels onChange={(_, value) => navigate(items[value].path)} sx={{height: 68, bgcolor: 'transparent', gap: 0.25}}>{items.map((item, index) => <BottomNavigationAction key={item.path} aria-current={index === selected ? 'page' : undefined} label={item.label} icon={item.icon} sx={{minWidth: 0, borderRadius: '14px', my: 0.25, color: index === selected ? 'primary.main' : 'text.secondary', '&.Mui-selected': {color: 'primary.main', bgcolor: 'rgba(200,243,107,.12)'}}}/>)}</BottomNavigation></Box>;
};

export default WLNav;
