import React from 'react';
import {Card, CardContent, Stack, Typography} from '@mui/material';
import Layout from '../../components/layout';
import {ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';
import {buildIdentity} from '../../config/buildIdentity';
import {AndroidUpdateCard} from '../../androidUpdate/AndroidUpdateCard';

export function AboutPage() {
    return <Layout title="About" hideNav>
        <ScreenContainer>
            <SectionHeader eyebrow="MAX & GYM" title="About and updates"/>
            <Stack spacing={2}>
                <Card><CardContent><Typography variant="h6">Installed build</Typography><Typography color="text.secondary">Version {buildIdentity.appVersion} · build {buildIdentity.buildNumber}</Typography><Typography variant="body2" color="text.secondary">{buildIdentity.gitSha}</Typography></CardContent></Card>
                <AndroidUpdateCard/>
            </Stack>
        </ScreenContainer>
    </Layout>;
}
