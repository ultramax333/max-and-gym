/*
    This file is part of RepQuest.

    RepQuest is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    RepQuest is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with RepQuest.  If not, see <https://www.gnu.org/licenses/>.
 */
import React, {ReactNode} from "react";
import Layout from "../../components/layout";
import {useTranslation} from "react-i18next";
import {Box, Card, CardActionArea, CardContent, Stack, Typography} from "@mui/material";
import {ArrowForwardRounded, Calculate, History, QueryStats, Straighten, TimerRounded} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';

function AppTile({title, description, icon, onClick}: {title: string; description: string; icon: ReactNode; onClick: () => void}) {
    return <Card><CardActionArea onClick={onClick} sx={{height: '100%', minHeight: 144}}><CardContent><Stack direction="row" gap={1.5} alignItems="flex-start"><Box sx={{width: 52, height: 52, flexShrink: 0, borderRadius: '17px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(83,199,183,.12)', color: 'primary.main'}}>{icon}</Box><Box sx={{minWidth: 0, flex: 1}}><Typography component="h2" variant="h6">{title}</Typography><Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>{description}</Typography></Box><ArrowForwardRounded sx={{color: 'text.disabled'}}/></Stack></CardContent></CardActionArea></Card>;
}

export const AppsMenu = () => {

    const {t} = useTranslation();
    const navigate = useNavigate();
    return <Layout showAccountMenu hideBack title={t("appsMenu.title")}><ScreenContainer><SectionHeader eyebrow="TOOLS" title={t("appsMenu.title")}/><Typography color="text.secondary" sx={{mt: -1, mb: 2.5}}>Training history, measurements and practical calculators in one place.</Typography><Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, minmax(0,1fr))'}, gap: 1.5}}>
        <AppTile title={t('history')} description="Browse completed training by date." icon={<History/>} onClick={() => navigate('/history')}/>
        <AppTile title={t('statsApp.title')} description="Review training totals and personal trends." icon={<QueryStats/>} onClick={() => navigate('/account/stats')}/>
        <AppTile title={t('account.bodyMeasures')} description="Track measurements stored on this device." icon={<Straighten/>} onClick={() => navigate('/account/measures')}/>
        <AppTile title={t('oneRmCalculator')} description="Estimate a one-repetition maximum locally." icon={<Calculate/>} onClick={() => navigate('/onerm')}/>
        <AppTile title={t('appsMenu.timer')} description="Run a simple standalone training timer." icon={<TimerRounded/>} onClick={() => navigate('/apps/timer')}/>
    </Box></ScreenContainer></Layout>;
}
