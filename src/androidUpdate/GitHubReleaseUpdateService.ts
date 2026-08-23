import {buildIdentity} from '../config/buildIdentity';

export const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/ultramax333/max-and-gym/releases/latest';
export const GITHUB_RELEASE_DOWNLOAD_PREFIX = 'https://github.com/ultramax333/max-and-gym/releases/download/';
const APK_NAME_PATTERN = /^max-and-gym-v(\d+\.\d+\.\d+)-(\d+)-release\.apk$/;

interface GitHubReleaseAsset {
    name?: unknown;
    state?: unknown;
    size?: unknown;
    browser_download_url?: unknown;
    digest?: unknown;
}

interface GitHubReleaseResponse {
    tag_name?: unknown;
    html_url?: unknown;
    draft?: unknown;
    prerelease?: unknown;
    immutable?: unknown;
    published_at?: unknown;
    assets?: unknown;
}

export interface AndroidReleaseUpdate {
    versionName: string;
    versionCode: number;
    downloadUrl: string;
    releaseUrl: string;
    assetName: string;
    assetSize: number;
    sha256: string;
    immutable: boolean;
    publishedAt?: string;
}

export type AndroidUpdateCheckResult =
    | {status: 'current'; currentVersion: string; latestVersion: string}
    | {status: 'available'; currentVersion: string; release: AndroidReleaseUpdate};

export class AndroidUpdateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AndroidUpdateError';
    }
}

function parseVersion(version: string): {core: [number, number, number]; prerelease?: string} {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
    if (!match) throw new AndroidUpdateError('The release uses an unsupported version format.');
    return {core: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: match[4]};
}

export function compareSemanticVersions(left: string, right: string): number {
    const a = parseVersion(left);
    const b = parseVersion(right);
    for (let index = 0; index < a.core.length; index += 1) {
        if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
    }
    if (!a.prerelease && b.prerelease) return 1;
    if (a.prerelease && !b.prerelease) return -1;
    if (a.prerelease !== b.prerelease) return (a.prerelease ?? '').localeCompare(b.prerelease ?? '');
    return 0;
}

function safeReleaseUrl(value: unknown): string {
    if (typeof value !== 'string') throw new AndroidUpdateError('The release page URL is missing.');
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || !url.pathname.startsWith('/ultramax333/max-and-gym/releases/')) {
        throw new AndroidUpdateError('The release page is outside the approved GitHub repository.');
    }
    return url.toString();
}

export function parseAndroidRelease(payload: unknown): AndroidReleaseUpdate {
    if (!payload || typeof payload !== 'object') throw new AndroidUpdateError('GitHub returned an invalid release response.');
    const release = payload as GitHubReleaseResponse;
    if (release.draft === true || release.prerelease === true) throw new AndroidUpdateError('Preview releases cannot update the installed app.');
    if (typeof release.tag_name !== 'string' || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) {
        throw new AndroidUpdateError('The release tag is not a supported application version.');
    }
    const versionName = release.tag_name.slice(1);
    const assets = Array.isArray(release.assets) ? release.assets as GitHubReleaseAsset[] : [];
    const candidates = assets.flatMap((asset) => {
        if (typeof asset.name !== 'string') return [];
        const match = APK_NAME_PATTERN.exec(asset.name);
        return match && match[1] === versionName ? [{asset, versionCode: Number(match[2])}] : [];
    });
    if (candidates.length !== 1) throw new AndroidUpdateError('The release must contain exactly one versioned release APK.');
    const {asset, versionCode} = candidates[0];
    if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
        throw new AndroidUpdateError('The release APK has an invalid Android version code.');
    }
    if (asset.state !== 'uploaded' || typeof asset.size !== 'number' || asset.size <= 0) {
        throw new AndroidUpdateError('The release APK is not ready for download.');
    }
    if (typeof asset.browser_download_url !== 'string' || !asset.browser_download_url.startsWith(GITHUB_RELEASE_DOWNLOAD_PREFIX)) {
        throw new AndroidUpdateError('The APK download is outside the approved GitHub repository.');
    }
    const downloadUrl = new URL(asset.browser_download_url);
    if (downloadUrl.protocol !== 'https:' || downloadUrl.hostname !== 'github.com' || !downloadUrl.pathname.endsWith(`/${asset.name}`)) {
        throw new AndroidUpdateError('The APK download URL does not match the release asset.');
    }
    const digest = typeof asset.digest === 'string' && /^sha256:[a-f0-9]{64}$/i.test(asset.digest)
        ? asset.digest.slice('sha256:'.length).toLowerCase()
        : undefined;
    if (!digest) throw new AndroidUpdateError('The release APK is missing its SHA-256 digest.');
    return {
        versionName,
        versionCode,
        downloadUrl: downloadUrl.toString(),
        releaseUrl: safeReleaseUrl(release.html_url),
        assetName: asset.name as string,
        assetSize: asset.size,
        sha256: digest,
        immutable: release.immutable === true,
        publishedAt: typeof release.published_at === 'string' ? release.published_at : undefined,
    };
}

export interface AndroidUpdateService {
    check(): Promise<AndroidUpdateCheckResult>;
}

export interface InstalledAndroidIdentity {
    versionName: string;
    versionCode?: number;
}

export function createGitHubReleaseUpdateService(
    fetcher: typeof fetch = fetch,
    installed: InstalledAndroidIdentity = {
        versionName: buildIdentity.appVersion,
        versionCode: Number.isSafeInteger(Number(buildIdentity.buildNumber)) ? Number(buildIdentity.buildNumber) : undefined,
    },
): AndroidUpdateService {
    return {
        async check() {
            const response = await fetcher(GITHUB_LATEST_RELEASE_API, {
                method: 'GET',
                credentials: 'omit',
                cache: 'no-store',
                headers: {
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2026-03-10',
                },
            });
            if (!response.ok) throw new AndroidUpdateError(`GitHub release check failed with status ${response.status}.`);
            const release = parseAndroidRelease(await response.json());
            if (compareSemanticVersions(release.versionName, installed.versionName) <= 0) {
                return {status: 'current', currentVersion: installed.versionName, latestVersion: release.versionName};
            }
            if (installed.versionCode !== undefined && release.versionCode <= installed.versionCode) {
                throw new AndroidUpdateError('The release version code would not upgrade the installed application.');
            }
            return {status: 'available', currentVersion: installed.versionName, release};
        },
    };
}

export const githubReleaseUpdateService = createGitHubReleaseUpdateService();
