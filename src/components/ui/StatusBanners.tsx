import React, {useEffect, useState} from 'react';
import {Alert, Box} from '@mui/material';

export function ConnectivityBanner() {
    const [online, setOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const markOnline = () => setOnline(true);
        const markOffline = () => setOnline(false);
        window.addEventListener('online', markOnline);
        window.addEventListener('offline', markOffline);
        return () => {
            window.removeEventListener('online', markOnline);
            window.removeEventListener('offline', markOffline);
        };
    }, []);

    if (online) return null;
    return <Box sx={{position: 'fixed', zIndex: 1300, top: {xs: 8, md: 16}, left: '50%', transform: 'translateX(-50%)', width: {xs: 'calc(100% - 32px)', sm: 'auto'}, maxWidth: 560}}><Alert severity="info">Offline mode: your data remains available on this device.</Alert></Box>;
}

export function StorageWarning({show = false}: {show?: boolean}) {
    if (!show) return null;
    return <Alert severity="warning">Local storage is almost full. Export a backup soon.</Alert>;
}
