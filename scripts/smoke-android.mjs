import {readFile} from 'node:fs/promises';

const html = await readFile(new URL('../build-android/index.html', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const gradle = await readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8');

if (/(["'])\/max-and-gym\//.test(html)) {
    throw new Error('Android build still contains the GitHub Pages base path.');
}

if (!html.includes('./assets/')) {
    throw new Error('Android build assets are not relative to the embedded WebView origin.');
}

if (/registerSW|service-worker|sw\.js/.test(html)) {
    throw new Error('Android build unexpectedly registers the PWA service worker.');
}

if (!gradle.includes("rootProject.file('../package.json')") || !gradle.includes('versionName appVersionName')) {
    throw new Error('Android versionName must be derived from package.json.');
}

if (!gradle.includes("System.getenv('ANDROID_VERSION_CODE')") || !gradle.includes('versionCode appVersionCode')) {
    throw new Error('Android versionCode must be supplied by the controlled Gradle version projection.');
}

console.log(`Android bundle smoke passed: v${packageJson.version}, relative assets and no service worker registration.`);
