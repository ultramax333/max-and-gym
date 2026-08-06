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
import React, {ReactElement, useContext, useEffect, useReducer, useState} from 'react';
import './App.css';
import {HashRouter, useNavigate} from "react-router-dom";
import {Box, CssBaseline, ThemeProvider} from '@mui/material';
import {DBContext} from "./context/dbContext";
import {DexieDB} from "./db/db";
import {WorkoutContextProvider} from './context/workoutContext';
import {AppTheme, SettingsContextProvider} from "./context/settingsContext";
import {UserContextProvider} from './context/userContext';
import ErrorBoundary from './components/errorBoundary';
import {TimerContextProvider} from "./context/timerContext";
import Loader from "./components/Loader";
import {useTranslation} from "react-i18next";
import {MasterDB} from "./db/masterDb";
import CalendarProvider from './context/calendarProvider';
import {DialogContextProvider} from './context/dialogContext';
import AppRoutes from "./AppRoutes";
import defer from "./utils/defer";
import {PwaProvider} from './pwa/PwaContext';
import {UpdatePrompt} from './pwa/UpdatePrompt';
import {maxGymTheme} from './theme/maxGymTheme';

const DBGuard = ({children}: { children: ReactElement }) => {
    const {db} = useContext(DBContext);
    const {t} = useTranslation();
    const [userReady, setUserReady] = useState(false);
    const [dbReady, setDbReady] = useState(false);
    const navigate = useNavigate();
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    useEffect(() => {
        if (userReady) return;
        if (!localStorage.getItem("userName") && location.hash !== "#/login")  {
            localStorage.setItem("userName", "Default User");
            defer(() => window.location.reload());
        } else setUserReady(true);
    }, [db]);
    useEffect(() => {
        if (userReady && db) db.plan.count().then((count) => {
            if (count === 0) {
                db.plan.put({
                    id: 1,
                    name: "RepQuest",
                    workoutIds: []
                }).then(() => {
                    setDbReady(true);
                    defer(() => {
                        location.hash = "#/onboarding";
                        forceUpdate();
                    });
                });
            } else {
                setDbReady(true);
            }
        });
    }, [db, userReady]);
    if (dbReady || location.hash === "#/login" || location.hash === "#/onboarding") return children;
    return <div style={{width: "100vw", height: "100vh"}}><Loader prompt={t("loading")}/></div>;
}

function App() {
    const appTheme: AppTheme = 'dark';
    return (
        <ErrorBoundary>
            <ThemeProvider theme={maxGymTheme}>
                <CssBaseline/>
                <DialogContextProvider>
                    <DBContext.Provider value={{db: new DexieDB(), masterDb: new MasterDB()}}>
                        <HashRouter>
                            <PwaProvider>
                                <>
                                <DBGuard>
                                    <TimerContextProvider>
                                        <UserContextProvider>
                                            <SettingsContextProvider theme={appTheme} setTheme={() => undefined}>
                                                <CalendarProvider>
                                                    <WorkoutContextProvider>
                                                        <Box sx={{minHeight: '100dvh', bgcolor: 'background.default'}}>
                                                            <AppRoutes />
                                                            <UpdatePrompt/>
                                                        </Box>
                                                    </WorkoutContextProvider>
                                                </CalendarProvider>
                                            </SettingsContextProvider>
                                        </UserContextProvider>
                                    </TimerContextProvider>
                                </DBGuard>
                                </>
                            </PwaProvider>
                        </HashRouter>
                    </DBContext.Provider>
                </DialogContextProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;
