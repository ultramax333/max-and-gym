import React from 'react';
import {Button, Snackbar} from '@mui/material';
import {usePwa} from './PwaContext';

export function UpdatePrompt() {
    const {updateWaiting, applyUpdate, deferUpdate} = usePwa();
    return <Snackbar
        open={updateWaiting}
        message="An update is ready. Apply it when no workout is active."
        action={<>
            <Button color="inherit" onClick={deferUpdate}>Later</Button>
            <Button color="secondary" variant="contained" onClick={() => void applyUpdate()}>Update</Button>
        </>}
    />;
}
