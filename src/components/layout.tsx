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
import React, {CSSProperties, ReactNode} from "react";
import WLAppBar from "./app_bar";
import WLNav from "./nav";
import {Box} from "@mui/material";
import {ConnectivityBanner} from './ui/StatusBanners';
import {ActiveWorkoutDock} from './ActiveWorkoutDock';

const Layout = (props: {
    children: ReactNode,
    title: string,
    hideAppBar?: boolean,
    hideNav?: boolean,
    hideBack?: boolean,
    showAccountMenu?: boolean,
    toolItems?: ReactNode,
    onBack?: () => void,
    sx?: CSSProperties,
    scroll?: boolean,
    leftToolItems?: ReactNode,
    nogrow?: boolean
}) => {
    const {children, title, nogrow, showAccountMenu, hideAppBar, hideNav, toolItems, leftToolItems, hideBack, onBack, sx, scroll} = props;
    return <Box sx={{display: 'flex', height: '100dvh', minHeight: 0, overflow: 'hidden', bgcolor: 'background.default'}}>
        <ConnectivityBanner/>
        {!hideNav && <WLNav desktop/>}
        <Box sx={{display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, height: '100dvh', minHeight: 0, ...(hideNav ? {} : {ml: {md: '88px'}})}}>
        {!hideAppBar && <WLAppBar title={title} showAccountMenu={showAccountMenu} leftToolItems={leftToolItems} toolItems={toolItems} hideBack={hideBack} onBack={onBack}/>}
        <Box component="main" sx={{flexGrow: nogrow ? undefined : 1, minHeight: 0, mt: hideAppBar ? 0 : 'calc(72px + env(safe-area-inset-top))', overflowY: scroll === false ? 'visible' : 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain', scrollbarGutter: 'stable', ...sx}}>{children}</Box>
        <ActiveWorkoutDock navigationVisible={!hideNav}/>
        {!hideNav && <WLNav/>}
        </Box>
    </Box>;
}

export default Layout;
