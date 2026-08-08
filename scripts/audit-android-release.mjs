import {readFile} from 'node:fs/promises';

const [gradle, workflow, providerPaths, gitignore] = await Promise.all([
    readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/android.yml', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/res/xml/file_paths.xml', import.meta.url), 'utf8'),
    readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
]);

const requiredSigningVariables = [
    'ANDROID_KEYSTORE_PATH',
    'ANDROID_KEY_ALIAS',
    'ANDROID_KEY_PASSWORD',
    'ANDROID_STORE_PASSWORD',
];

for (const variable of requiredSigningVariables) {
    if (!gradle.includes(variable)) {
        throw new Error(`Gradle release signing is missing ${variable}.`);
    }
}

if (!gradle.includes("System.getenv('ANDROID_VERSION_CODE')") || !workflow.includes('ANDROID_VERSION_CODE_FLOOR')) {
    throw new Error('Android versionCode is not controlled by the CI monotonic projection.');
}

if (!gradle.includes("rootProject.file('../package.json')") || !gradle.includes('versionName appVersionName')) {
    throw new Error('Android versionName is not derived from package.json.');
}

if (!gradle.includes('Release output is disabled until all Android signing environment variables are configured.')) {
    throw new Error('Unsigned release assembly is not blocked.');
}

if (!/apksigner["']?\s+verify --verbose --print-certs/.test(workflow)) {
    throw new Error('The Android workflow does not verify the signed release APK.');
}

if (!workflow.includes("github.ref == 'refs/heads/master'") || !workflow.includes('ANDROID_KEYSTORE_BASE64')) {
    throw new Error('Signed release creation must be restricted to master and secret-backed.');
}

const providerEntries = [...providerPaths.matchAll(/<([\w-]+)\s+name="[^"]+"\s+path="([^"]+)"\s*\/>/g)]
    .map((match) => ({type: match[1], path: match[2]}));
if (providerEntries.length !== 2 || providerEntries.some(({type, path}) =>
    !['files-path', 'cache-path'].includes(type) || path !== 'shared/')) {
    throw new Error('FileProvider must expose only the dedicated private shared directory.');
}

if (!gitignore.includes('*.jks') || !gitignore.includes('*.keystore')) {
    throw new Error('Android keystore files must remain ignored.');
}

console.log('Android release audit passed: controlled versions, secret-backed signing, verified APK and narrow FileProvider paths.');
