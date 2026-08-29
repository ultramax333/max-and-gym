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
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import {VitePWA} from "vite-plugin-pwa";

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {version: string};
const appVersion = process.env.npm_package_version ?? packageJson.version;
const isAndroidBuild = process.env.MAX_GYM_TARGET === 'android';
const githubPagesBase = '/max-and-gym/';
const cacheVersion = '8';
const gitSha = process.env.GITHUB_SHA ?? (() => {
    try {
        return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {encoding: 'utf8'}).trim();
    } catch {
        return 'unknown';
    }
})();
const buildTimestamp = process.env.BUILD_TIMESTAMP ?? new Date().toISOString();

export default defineConfig({
    base: isAndroidBuild ? './' : githubPagesBase,
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
        __BUILD_NUMBER__: JSON.stringify(isAndroidBuild ? process.env.ANDROID_VERSION_CODE ?? '120000000' : process.env.GITHUB_RUN_NUMBER ?? 'local'),
        __GIT_SHA__: JSON.stringify(gitSha),
        __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
        __BUILD_ENVIRONMENT__: JSON.stringify(isAndroidBuild ? 'android' : process.env.GITHUB_ACTIONS ? 'github-pages' : 'local'),
    },
    build: {
        outDir: isAndroidBuild ? 'build-android' : 'build',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('/node_modules/i18next/') || id.includes('/node_modules/react-i18next/')) return 'i18n-vendor';
                },
            },
        },
    },
    plugins: [react(), VitePWA({
        disable: isAndroidBuild,
        registerType: 'autoUpdate',
        injectRegister: false,
        workbox: {
            skipWaiting: true,
            clientsClaim: true,
            maximumFileSizeToCacheInBytes: 3000000,
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            cleanupOutdatedCaches: true,
            cacheId: `max-and-gym-cache-v${cacheVersion}`,
            runtimeCaching: [{
                urlPattern: /\/media\/exercises\/.*\.jpg$/,
                handler: 'CacheFirst',
                options: {
                    cacheName: `max-gym-exercise-media-v${cacheVersion}`,
                    expiration: {maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 30},
                    cacheableResponse: {statuses: [0, 200]},
                },
            }]
        },
        manifest: {
            "id": "/max-and-gym/",
            "dir": "ltr",
            "orientation": "portrait",
            "short_name": "Max & Gym",
            "name": "Max & Gym",
            "description": "Local-first workout tracking.",
            "lang": "en",
            "icons": [
                {
                    "src": "favicon.ico",
                    "sizes": "64x64 32x32 24x24 16x16",
                    "type": "image/x-icon"
                },
                {
                    "src": "logo192.png",
                    "type": "image/png",
                    "sizes": "192x192"
                },
                {
                    "src": "logo512.png",
                    "type": "image/png",
                    "sizes": "512x512"
                }
            ],
            "start_url": ".",
            "display": "standalone",
            "theme_color": "#1F1F8B",
            "background_color": "#121212",
            "categories": ["fitness", "health", "health & fitness"]
        }
    })],
    server: {
        port: 3000
    }
})
