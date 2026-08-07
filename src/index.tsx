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
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import enJson from "./i18n/en.json";
import caJson from "./i18n/ca.json";
import esJson from "./i18n/es.json";
import {installGlobalDiagnosticCapture} from './diagnostics/globalCapture';
import {installProductionConsoleGuard} from './diagnostics/consoleGuard';
import {RELEASE_DEFAULTS} from './config/releaseDefaults';

if (import.meta.env.PROD) installProductionConsoleGuard();
installGlobalDiagnosticCapture();

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        lng: localStorage.getItem('lang') || RELEASE_DEFAULTS.language,
        resources: {
            en: {
                translation: enJson
            },
            ca: {
                translation: caJson
            },
            es: {
                translation: esJson
            }
        },
        fallbackLng: "en",

        interpolation: {
            escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
        }
    });

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
);

declare global {
    interface BeforeInstallPromptEvent extends Event {
        prompt: () => Promise<void>;
        userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
    }
    interface Window { deferredPrompt?: BeforeInstallPromptEvent }
}
window.addEventListener('beforeinstallprompt', (event: Event) => {
    window.deferredPrompt = event as BeforeInstallPromptEvent;
});
