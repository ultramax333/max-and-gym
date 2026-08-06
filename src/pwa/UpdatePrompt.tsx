import React from 'react';
import {Button, Snackbar} from '@mui/material';
import {usePwa} from './PwaContext';

export function UpdatePrompt() {
    const {updateWaiting, applyUpdate, deferUpdate} = usePwa();
    return <Snackbar
        open={updateWaiting}
        message="Une mise à jour est prête. Appliquez-la quand aucune séance n’est active."
        action={<>
            <Button color="inherit" onClick={deferUpdate}>Plus tard</Button>
            <Button color="secondary" variant="contained" onClick={() => void applyUpdate()}>Mettre à jour</Button>
        </>}
    />;
}
