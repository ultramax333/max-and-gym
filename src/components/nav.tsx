import React from 'react';
import {Box, BottomNavigation, BottomNavigationAction, Paper, Tooltip} from '@mui/material';
import {useLocation, useNavigate} from 'react-router-dom';
import {CalendarMonth, FitnessCenter, HomeRounded, Timeline, ViewModule} from '@mui/icons-material';

const items = [
    {path: '/', label: 'Accueil', icon: <HomeRounded/>},
    {path: '/train', label: 'Entraîner', icon: <FitnessCenter/>},
    {path: '/programs', label: 'Programmes', icon: <CalendarMonth/>},
    {path: '/progress', label: 'Progression', icon: <Timeline/>},
    {path: '/library', label: 'Bibliothèque', icon: <ViewModule/>},
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
    if (desktop) return <Paper component="nav" aria-label="Navigation principale" sx={{display: {xs: 'none', md: 'flex'}, position: 'fixed', zIndex: 1200, left: 0, top: 0, bottom: 0, width: 88, borderRadius: 0, border: 0, borderRight: '1px solid', borderColor: 'divider', alignItems: 'center', flexDirection: 'column', py: 2, gap: 1}}>{items.map((item, index) => <Tooltip key={item.path} title={item.label} placement="right"><BottomNavigationAction aria-label={item.label} label={item.label} icon={item.icon} showLabel onClick={() => navigate(item.path)} sx={{width: 72, minWidth: 72, minHeight: 64, borderRadius: 3, ...(index === selected ? {bgcolor: 'rgba(83,199,183,.14)', color: 'primary.main'} : {})}}/></Tooltip>)}</Paper>;
    return <Box component="nav" aria-label="Navigation principale" sx={{display: {xs: 'block', md: 'none'}, position: 'fixed', zIndex: 1200, left: 0, right: 0, bottom: 0, pb: 'env(safe-area-inset-bottom)', bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider'}}><BottomNavigation value={selected} showLabels onChange={(_, value) => navigate(items[value].path)} sx={{height: 72, bgcolor: 'transparent'}}>{items.map((item) => <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} sx={{minWidth: 0, '&.Mui-selected': {color: 'primary.main'}}}/>)}</BottomNavigation></Box>;
};

export default WLNav;
