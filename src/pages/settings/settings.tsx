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
import React, {ReactNode, useContext} from "react";
import Layout from "../../components/layout";
import {useTranslation} from "react-i18next";
import {Avatar, List, ListItemAvatar, ListItemButton, ListItemText, Paper, Stack, Typography} from "@mui/material";
import pjson from "../../../package.json";
import {Build, Cake, ChevronRight, FormatPaint, Info, MonitorHeart, NotificationsActive, Person} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import BackupIcon from "@mui/icons-material/Backup";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {UserContext} from "../../context/userContext";
import {ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';

function SettingsGroup({title, children}: {title: string; children: ReactNode}) {
    return <Stack spacing={1}><Typography variant="overline" color="text.secondary" sx={{px: 0.5}}>{title}</Typography><Paper sx={{p: 0.75, borderRadius: '20px'}}><List disablePadding>{children}</List></Paper></Stack>;
}

function SettingsEntry({icon, primary, secondary, onClick, href, target}: {icon: ReactNode; primary: ReactNode; secondary?: ReactNode; onClick?: () => void; href?: string; target?: string}) {
    return <ListItemButton component="a" onClick={onClick} href={href} target={target} rel={target ? 'noopener noreferrer' : undefined} sx={{px: 1.25}}><ListItemAvatar><Avatar sx={{bgcolor: 'rgba(200,243,107,.12)', color: 'primary.main'}}>{icon}</Avatar></ListItemAvatar><ListItemText primary={primary} secondary={secondary} primaryTypographyProps={{fontWeight: 750}}/><ChevronRight sx={{color: 'text.disabled', flexShrink: 0}}/></ListItemButton>;
}

export const SettingsPage = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {userName} = useContext(UserContext);
    return <Layout showAccountMenu title={t("settings")}><ScreenContainer><SectionHeader eyebrow="APP CONTROL" title={t("settings")}/><Stack spacing={2.5}>
        <SettingsGroup title="PROFILE & APPEARANCE">
            <SettingsEntry icon={<Person/>} primary={userName || t("account.title")} secondary={userName ? t("account.title") : undefined} onClick={() => navigate('/account')}/>
            <SettingsEntry icon={<FormatPaint/>} primary={t('appearanceSettings')} secondary={t('appearanceSettingsDescription')} onClick={() => navigate('/settings/appearance')}/>
        </SettingsGroup>
        <SettingsGroup title="TRAINING & FEEDBACK">
            <SettingsEntry icon={<FitnessCenterIcon/>} primary={t('workoutSettings')} secondary={t('workoutSettingsDescription')} onClick={() => navigate('/settings/workout')}/>
            <SettingsEntry icon={<NotificationsActive/>} primary="Rest alarm" secondary="Duration, tone, vibration and notification actions" onClick={() => navigate('/settings/rest-alarm')}/>
        </SettingsGroup>
        <SettingsGroup title="DATA & SYSTEM">
            <SettingsEntry icon={<BackupIcon/>} primary={t('backup.title')} secondary={t('backup.description')} onClick={() => navigate('/backup')}/>
            <SettingsEntry icon={<Build/>} primary={t('system')} secondary={t('systemDescription')} onClick={() => navigate('/settings/system')}/>
            <SettingsEntry icon={<MonitorHeart/>} primary="Diagnostics" secondary="Check storage, migrations and local status." onClick={() => navigate('/diagnostics')}/>
        </SettingsGroup>
        <SettingsGroup title="ABOUT">
            <SettingsEntry icon={<Info/>} primary="About and updates" secondary={`Version ${pjson.version} · manual Android update check`} onClick={() => navigate('/settings/about')}/>
            <SettingsEntry icon={<Cake/>} primary={t('whatsNew')} secondary={`${t('version')} ${pjson.version}`} onClick={() => navigate('/whats-new')}/>
        </SettingsGroup>
    </Stack></ScreenContainer>
    </Layout>;
}
