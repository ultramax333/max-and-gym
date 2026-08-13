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
import React, {ReactNode, useContext, useState} from "react";
import Layout from "../../components/layout";
import {useTranslation} from "react-i18next";
import {Avatar, List, ListItemAvatar, ListItemButton, ListItemText, Paper, Stack, Typography} from "@mui/material";
import TranslateIcon from '@mui/icons-material/Translate';
import pjson from "../../../package.json";
import i18n from "i18next";
import Selector from "../../components/selector";
import {Build, Cake, Campaign, ChevronRight, FormatPaint, Info, MonitorHeart, NotificationsActive, Person} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import BackupIcon from "@mui/icons-material/Backup";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import {SettingsContext} from "../../context/settingsContext";
import {UserContext} from "../../context/userContext";
import languages from "../../i18n/languages";
import {ScreenContainer, SectionHeader} from '../../components/ui/UiPrimitives';

function SettingsGroup({title, children}: {title: string; children: ReactNode}) {
    return <Stack spacing={1}><Typography variant="overline" color="text.secondary" sx={{px: 0.5}}>{title}</Typography><Paper sx={{p: 0.75, borderRadius: '20px'}}><List disablePadding>{children}</List></Paper></Stack>;
}

function SettingsEntry({icon, primary, secondary, onClick, href, target}: {icon: ReactNode; primary: ReactNode; secondary?: ReactNode; onClick?: () => void; href?: string; target?: string}) {
    return <ListItemButton component="a" onClick={onClick} href={href} target={target} rel={target ? 'noopener noreferrer' : undefined} sx={{px: 1.25}}><ListItemAvatar><Avatar sx={{bgcolor: 'rgba(83,199,183,.12)', color: 'primary.main'}}>{icon}</Avatar></ListItemAvatar><ListItemText primary={primary} secondary={secondary} primaryTypographyProps={{fontWeight: 750}}/><ChevronRight sx={{color: 'text.disabled', flexShrink: 0}}/></ListItemButton>;
}

export const SettingsPage = () => {
    const {t} = useTranslation();
    const {lang, saveLang} = useContext(SettingsContext);
    const navigate = useNavigate();
    const [openLanguage, setOpenLanguage] = useState(false);
    const {userName} = useContext(UserContext);
    return <Layout showAccountMenu title={t("settings")}><ScreenContainer><SectionHeader eyebrow="APP CONTROL" title={t("settings")}/><Stack spacing={2.5}>
        <SettingsGroup title="PROFILE & APPEARANCE">
            <SettingsEntry icon={<Person/>} primary={userName || t("account.title")} secondary={userName ? t("account.title") : undefined} onClick={() => navigate('/account')}/>
            <SettingsEntry icon={<TranslateIcon/>} primary={t('language')} secondary={languages.find((entry) => entry.key === lang)?.value ?? lang} onClick={() => setOpenLanguage(true)}/>
            <SettingsEntry icon={<FormatPaint/>} primary={t('appearanceSettings')} secondary={t('appearanceSettingsDescription')} onClick={() => navigate('/settings/appearance')}/>
        </SettingsGroup>
        <SettingsGroup title="TRAINING & FEEDBACK">
            <SettingsEntry icon={<FitnessCenterIcon/>} primary={t('workoutSettings')} secondary={t('workoutSettingsDescription')} onClick={() => navigate('/settings/workout')}/>
            <SettingsEntry icon={<NotificationsActive/>} primary="Rest alarm" secondary="Duration, tone, vibration and notification actions" onClick={() => navigate('/settings/rest-alarm')}/>
        </SettingsGroup>
        <SettingsGroup title="DATA & SYSTEM">
            <SettingsEntry icon={<BackupIcon/>} primary={t('backup.title')} secondary={t('backup.description')} onClick={() => navigate('/settings/backup')}/>
            <SettingsEntry icon={<Build/>} primary={t('system')} secondary={t('systemDescription')} onClick={() => navigate('/settings/system')}/>
            <SettingsEntry icon={<MonitorHeart/>} primary="Diagnostics" secondary="Check storage, migrations and local status." onClick={() => navigate('/diagnostics')}/>
        </SettingsGroup>
        <SettingsGroup title="ABOUT">
            <SettingsEntry icon={<Info/>} primary="About and updates" secondary={`Version ${pjson.version} · manual Android update check`} onClick={() => navigate('/settings/about')}/>
            <SettingsEntry icon={<Campaign/>} primary={t('feedback')} secondary={t('feedbackDescription')} href="https://docs.google.com/forms/d/e/1FAIpQLSdrG44hZZ8MoGzFx2DjIVKSnFylDDbCHtaQL3vhEGM4yuOb8g/viewform?usp=sf_link" target="_blank"/>
            <SettingsEntry icon={<Cake/>} primary={t('whatsNew')} secondary={`${t('version')} ${pjson.version}`} onClick={() => navigate('/whats-new')}/>
        </SettingsGroup>
    </Stack></ScreenContainer>
        <Selector
            defaultValue={i18n.language}
            open={openLanguage}
            onClose={(val: string) => {
                if (saveLang) saveLang(val);
                i18n.changeLanguage(val).then();
                setOpenLanguage(false);
            }}
            title={t("language")}
            entries={languages}
        />
    </Layout>;
}
