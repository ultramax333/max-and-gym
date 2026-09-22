import React, {useEffect, useState} from 'react';
import {Box, ButtonBase, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography} from '@mui/material';
import {Close, FitnessCenter} from '@mui/icons-material';
import {LibraryExercise} from '../../exerciseCatalog/types';
import {displayExerciseMedia, DisplayExerciseMedia} from '../../exerciseCatalog/displayMedia';

function Photo({media, onOpen}: {media: DisplayExerciseMedia; onOpen?: () => void}) {
    const [local, setLocal] = useState<{blob: Blob; url: string}>();
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        setFailed(false);
        if (!media.blob) return;
        const url = URL.createObjectURL(media.blob);
        setLocal({blob: media.blob, url});
        return () => URL.revokeObjectURL(url);
    }, [media.blob, media.path]);
    const src = media.blob ? (local?.blob === media.blob ? local.url : undefined) : `${import.meta.env.BASE_URL}${media.path}`;
    const content = src && !failed ? <Box component="img" src={src} alt={media.altText} onError={() => setFailed(true)} loading="lazy" sx={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}}/>
        : <Typography variant="caption">{failed ? 'Photo unavailable' : 'Loading photo…'}</Typography>;
    return onOpen ? <ButtonBase aria-label={`Enlarge ${media.altText}`} onClick={onOpen} sx={{minWidth: 0, width: '100%', height: '100%', bgcolor: 'background.default'}}>{content}</ButtonBase>
        : <Box sx={{minWidth: 0, height: '100%', bgcolor: 'background.default'}}>{content}</Box>;
}

export function ExercisePhotos({exercise, media, compact = false, interactive = true}: {exercise?: LibraryExercise; media?: DisplayExerciseMedia[]; compact?: boolean; interactive?: boolean}) {
    const images = media ?? displayExerciseMedia(exercise);
    const [enlarged, setEnlarged] = useState<DisplayExerciseMedia>();
    const visible = compact ? images.slice(0, 1) : images;
    return <><Box sx={{width: '100%', height: '100%', minHeight: 64, display: 'grid', gridTemplateColumns: visible.length > 1 ? '1fr 1fr' : '1fr', gap: '1px', bgcolor: 'background.default'}}>
        {visible.length ? visible.map((entry, index) => <Photo key={`${exercise?.id ?? ''}-${entry.path}-${index}`} media={entry} onOpen={interactive ? () => setEnlarged(entry) : undefined}/>)
            : <Stack alignItems="center" justifyContent="center" color="text.secondary"><FitnessCenter/><Typography variant="caption">No local photo</Typography></Stack>}
    </Box><Dialog open={Boolean(enlarged)} onClose={() => setEnlarged(undefined)} fullScreen>
        <DialogTitle><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography component="span">Exercise photo</Typography><IconButton aria-label="Close photo" onClick={() => setEnlarged(undefined)}><Close/></IconButton></Stack></DialogTitle>
        <DialogContent sx={{p: 1, minHeight: 0}}>{enlarged && <Photo media={enlarged}/>}</DialogContent>
    </Dialog></>;
}
