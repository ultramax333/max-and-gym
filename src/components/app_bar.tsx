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
import * as React from 'react';
import {ReactNode, useContext, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import BackIcon from '@mui/icons-material/ArrowBack';
import {useLocation, useNavigate} from "react-router-dom";
import {UserContext} from "../context/userContext";
import {Avatar, IconButton, Popover, Stack, Tooltip} from "@mui/material";
import SettingsIcon from '@mui/icons-material/Settings';
import {AccountMenuList} from '../pages/profile/accountMenu';
import {buildIdentity} from '../config/buildIdentity';

export interface WLAppBarProps {
    title: string;
    toolItems?: ReactNode;
    leftToolItems?: ReactNode;
    hideBack?: boolean;
    showAccountMenu?: boolean;
    onBack?: () => void;
}

export const WLAppBar = (props: WLAppBarProps) => {
    const location = useLocation();
    const {title, toolItems, leftToolItems, hideBack, onBack, showAccountMenu} = props;
    const navigate = useNavigate();
    const {user} = useContext(UserContext);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState<HTMLElement | undefined>(undefined);
    return <Box>
        <AppBar position="fixed" elevation={0} sx={{zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: 'rgba(9,13,18,.88)', backdropFilter: 'blur(18px)', borderBottom: '1px solid', borderColor: 'rgba(38,51,66,.82)'}}>
            <Toolbar sx={{minHeight: '72px !important', px: {xs: 1, sm: 2.5}, gap: 0.5}}>
                {leftToolItems}
                {!["/", "/train", "/programs", "/progress", "/library", "/workouts", "/apps", "/settings", "/exercises"].includes(location.pathname) && !hideBack && <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="Back"
                    sx={{mr: {xs: 0.5, sm: 1.5}}}
                    onClick={() => {
                        if (!onBack) navigate(-1);
                        else onBack();
                    }}
                >
                    <BackIcon/>
                </IconButton>}
                <Box sx={{flexGrow: 1, minWidth: 0, pl: 0.5}}>
                    <Stack direction="row" alignItems="center" gap={1}><Box aria-hidden sx={{width: 6, height: 18, borderRadius: 4, bgcolor: 'primary.main', boxShadow: '0 0 18px rgba(83,199,183,.4)'}}/><Typography variant="h6" component="div" sx={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{title}</Typography></Stack>
                    <Typography variant="caption" color="text.secondary" sx={{display: 'block', lineHeight: 1}}>v{buildIdentity.appVersion} · build {buildIdentity.buildNumber}</Typography>
                </Box>
                <Box sx={{flexShrink: 0, whiteSpace: "nowrap"}}>{toolItems}<Tooltip title="Settings"><IconButton aria-label="Open settings" onClick={() => navigate('/settings')} sx={{color: location.pathname.startsWith('/settings') ? 'primary.main' : 'text.secondary'}}><SettingsIcon/></IconButton></Tooltip>{showAccountMenu && <IconButton aria-label="Open account" onClick={(ev) => setAccountMenuAnchor(accountMenuAnchor ? undefined : ev.currentTarget)}><Avatar sx={{width: 32, height: 32}} src={user?.picture} /></IconButton>}</Box>
            </Toolbar>
            <Popover
                open={accountMenuAnchor !== undefined}
                anchorEl={accountMenuAnchor}
                onClose={() => setAccountMenuAnchor(undefined)}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
            >
                <AccountMenuList />
            </Popover>
        </AppBar>
    </Box>;
}

export default WLAppBar;
