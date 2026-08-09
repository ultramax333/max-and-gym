import {readFile} from 'node:fs/promises';

const [gradle, workflow, providerPaths, gitignore, updatePlugin, mainActivity, manifest, viteConfig] = await Promise.all([
    readFile(new URL('../android/app/build.gradle', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/android.yml', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/res/xml/file_paths.xml', import.meta.url), 'utf8'),
    readFile(new URL('../.gitignore', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/java/io/github/ultramax333/maxandgym/AndroidUpdatePlugin.java', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/java/io/github/ultramax333/maxandgym/MainActivity.java', import.meta.url), 'utf8'),
    readFile(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8'),
    readFile(new URL('../vite.config.ts', import.meta.url), 'utf8'),
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

if (!workflow.includes("if: github.ref == 'refs/heads/master'\n        id: signing") || !workflow.includes('ANDROID_KEYSTORE_BASE64')) {
    throw new Error('Signing secrets must be referenced only by a master-gated step.');
}

if (!workflow.includes('max-and-gym-v${{ steps.android-version.outputs.version_name }}-${{ steps.android-version.outputs.version_code }}-release.apk')) {
    throw new Error('The signed APK does not have the versioned GitHub Release discovery name.');
}

if (!workflow.includes('gh release create') || !workflow.includes('keeping its immutable APK') || !workflow.includes('refusing an ambiguous publication')) {
    throw new Error('Master releases do not safely publish a non-replaceable GitHub Release.');
}

if (!workflow.includes("- 'feat/**'") || !workflow.includes("steps.signing.outputs.enabled == 'true'")) {
    throw new Error('Feature branches must build debug APKs and release publication must remain signing-gated.');
}

const signatureVerification = workflow.indexOf('apksigner" verify --verbose --print-certs');
const releasePublication = workflow.indexOf('gh release create');
if (signatureVerification < 0 || releasePublication <= signatureVerification) {
    throw new Error('GitHub Release publication must occur only after APK signature verification.');
}

if (!mainActivity.includes('registerPlugin(AndroidUpdatePlugin.class)') ||
    !updatePlugin.includes('downloadAndInstall(PluginCall call)') ||
    !updatePlugin.includes('DownloadManager') ||
    !updatePlugin.includes('APPROVED_HOST = "github.com"') ||
    !updatePlugin.includes('APPROVED_PATH_PREFIX = "/ultramax333/max-and-gym/releases/download/"')) {
    throw new Error('The Android update launcher is not registered or repository-scoped.');
}

if (!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')) {
    throw new Error('Android in-app updates must declare the package installation permission.');
}

if (!mainActivity.includes('getOnBackPressedDispatcher()') ||
    !mainActivity.includes('webView.canGoBack()') ||
    !mainActivity.includes('webView.goBack()')) {
    throw new Error('Android back navigation must consume WebView history before exiting at the root.');
}

if (!viteConfig.includes("isAndroidBuild ? process.env.ANDROID_VERSION_CODE ?? '120000000'")) {
    throw new Error('The embedded Android build does not expose its installed versionCode for downgrade protection.');
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
