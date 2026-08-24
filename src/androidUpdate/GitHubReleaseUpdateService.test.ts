import {vi} from 'vitest';
import {compareSemanticVersions, createGitHubReleaseUpdateService, parseAndroidRelease} from './GitHubReleaseUpdateService';

function release(overrides: Record<string, unknown> = {}) {
    return {
        tag_name: 'v1.1.0',
        html_url: 'https://github.com/ultramax333/max-and-gym/releases/tag/v1.1.0',
        draft: false,
        prerelease: false,
        immutable: true,
        published_at: '2026-08-08T00:00:00Z',
        assets: [{
            name: 'max-and-gym-v1.1.0-120000010-release.apk',
            state: 'uploaded',
            size: 12_000_000,
            browser_download_url: 'https://github.com/ultramax333/max-and-gym/releases/download/v1.1.0/max-and-gym-v1.1.0-120000010-release.apk',
            digest: `sha256:${'a'.repeat(64)}`,
        }],
        ...overrides,
    };
}

describe('GitHubReleaseUpdateService', () => {
    it('compares strict semantic versions without lexicographic mistakes', () => {
        expect(compareSemanticVersions('1.10.0', '1.9.9')).toBe(1);
        expect(compareSemanticVersions('1.2.0', '1.2.0')).toBe(0);
        expect(compareSemanticVersions('1.1.9', '1.2.0')).toBe(-1);
    });

    it('accepts exactly one versioned APK from the approved GitHub repository', () => {
        expect(parseAndroidRelease(release())).toMatchObject({
            versionName: '1.1.0',
            versionCode: 120000010,
            immutable: true,
            sha256: 'a'.repeat(64),
        });
    });

    it('rejects a release asset hosted outside the approved repository', () => {
        const payload = release();
        (payload.assets[0] as Record<string, unknown>).browser_download_url = 'https://example.invalid/update.apk';
        expect(() => parseAndroidRelease(payload)).toThrow(/outside the approved GitHub repository/i);
    });

    it('rejects duplicate release APK candidates', () => {
        const payload = release();
        payload.assets.push({...payload.assets[0]});
        expect(() => parseAndroidRelease(payload)).toThrow(/exactly one/i);
    });

    it('rejects an APK without a GitHub SHA-256 digest', () => {
        const payload = release();
        delete (payload.assets[0] as Record<string, unknown>).digest;
        expect(() => parseAndroidRelease(payload)).toThrow(/missing its SHA-256 digest/i);
    });

    it('performs an opt-in unauthenticated GitHub API check', async () => {
        const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(release()), {status: 200, headers: {'Content-Type': 'application/json'}}));
        const service = createGitHubReleaseUpdateService(fetcher as typeof fetch, {versionName: '1.0.0', versionCode: 120000001});
        await expect(service.check()).resolves.toMatchObject({status: 'available', currentVersion: '1.0.0'});
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher.mock.calls[0][1]).toMatchObject({method: 'GET', credentials: 'omit', cache: 'no-store'});
        expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({'X-GitHub-Api-Version': '2026-03-10'});
    });

    it('rejects a newer version name whose Android versionCode cannot upgrade the installed app', async () => {
        const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(release()), {status: 200}));
        const service = createGitHubReleaseUpdateService(fetcher as typeof fetch, {versionName: '1.0.0', versionCode: 120000010});
        await expect(service.check()).rejects.toThrow(/would not upgrade/i);
    });
});
