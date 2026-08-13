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
    if (desktop) return <Paper component="nav" aria-label="Primary navigation" sx={{display: {xs: 'none', md: 'flex'}, position: 'fixed', zIndex: 1200, left: 0, top: 0, bottom: 0, width: 88, borderRadius: 0, border: 0, borderRight: '1px solid', borderColor: 'divider', alignItems: 'center', flexDirection: 'column', pt: 10.5, pb: 2, gap: 1, bgcolor: 'rgba(16,23,32,.92)', backdropFilter: 'blur(18px)'}}><Box sx={{position: 'absolute', top: 16, width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: '18px', bgcolor: 'rgba(83,199,183,.12)', border: '1px solid rgba(83,199,183,.22)'}}><Typography aria-label="Max and Gym" fontWeight={900} color="primary.main">M&G</Typography></Box>{items.map((item, index) => <Tooltip key={item.path} title={item.label} placement="right"><BottomNavigationAction aria-label={item.label} label={item.label} icon={item.icon} showLabel onClick={() => navigate(item.path)} sx={{width: 72, minWidth: 72, minHeight: 64, borderRadius: '18px', color: index === selected ? 'primary.main' : 'text.secondary', ...(index === selected ? {bgcolor: 'rgba(83,199,183,.14)', border: '1px solid rgba(83,199,183,.18)'} : {})}}/></Tooltip>)}</Paper>;
    return <Box component="nav" aria-label="Primary navigation" sx={{display: {xs: 'block', md: 'none'}, position: 'fixed', zIndex: 1200, left: 0, right: 0, bottom: 0, px: 0.75, pt: 0.5, pb: 'env(safe-area-inset-bottom)', bgcolor: 'rgba(16,23,32,.94)', backdropFilter: 'blur(18px)', borderTop: '1px solid', borderColor: 'divider', borderRadius: '22px 22px 0 0', boxShadow: '0 -12px 32px rgba(0,0,0,.28)'}}><BottomNavigation value={selected} showLabels onChange={(_, value) => navigate(items[value].path)} sx={{height: 68, bgcolor: 'transparent', gap: 0.25}}>{items.map((item, index) => <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} sx={{minWidth: 0, borderRadius: '14px', my: 0.25, color: index === selected ? 'primary.main' : 'text.secondary', '&.Mui-selected': {color: 'primary.main', bgcolor: 'rgba(83,199,183,.1)'}}}/>)}</BottomNavigation></Box>;
};

export default WLNav;
