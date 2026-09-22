import React from 'react';
import {Button, Snackbar} from '@mui/material';
import {usePwa} from './PwaContext';

export function UpdatePrompt() {
    const {updateWaiting, updateMessage, applyUpdate, deferUpdate} = usePwa();
    return <Snackbar
        open={updateWaiting}
        message={updateMessage ?? 'An update is ready. Your current page will not reload.'}
        action={<>
            <Button color="inherit" onClick={deferUpdate}>Later</Button>
            <Button color="secondary" variant="contained" onClick={() => void applyUpdate()}>How to update</Button>
        </>}
    />;
}
