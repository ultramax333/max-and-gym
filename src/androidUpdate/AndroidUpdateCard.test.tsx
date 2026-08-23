import React from 'react';
import {vi} from 'vitest';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {DBContext} from '../context/dbContext';
import {DexieDB} from '../db/db';
import {AndroidUpdateCard} from './AndroidUpdateCard';
import {AndroidUpdateLauncher, AndroidUpdateStatus} from './androidUpdateLauncher';
import {AndroidUpdateService} from './GitHubReleaseUpdateService';

const update = {
    versionName: '1.1.0',
    versionCode: 120000010,
    downloadUrl: 'https://github.com/ultramax333/max-and-gym/releases/download/v1.1.0/max-and-gym-v1.1.0-120000010-release.apk',
    releaseUrl: 'https://github.com/ultramax333/max-and-gym/releases/tag/v1.1.0',
    assetName: 'max-and-gym-v1.1.0-120000010-release.apk',
    assetSize: 12_000_000,
    sha256: 'a'.repeat(64),
    immutable: true,
};

const downloadingStatus = {
    phase: 'downloading' as const,
    downloadedBytes: 0,
    totalBytes: 12_000_000,
    percent: 0,
    staged: false,
    downloading: true,
};

function renderCard(service: AndroidUpdateService, launcher: AndroidUpdateLauncher, block?: 'active-workout' | 'critical-write') {
    return render(<DBContext.Provider value={{db: {} as DexieDB}}><AndroidUpdateCard service={service} launcher={launcher} readBlockReason={async () => block}/></DBContext.Provider>);
}

describe('AndroidUpdateCard', () => {
    it('reconciles a completed download into a visible verification phase after remount', async () => {
        const service = {check: vi.fn()};
        const launcher = {
            isNativeAndroid: () => true,
            downloadAndInstall: vi.fn(async () => ({status: 'downloading' as const})),
            getUpdateStatus: vi.fn(async () => ({
                phase: 'verifying' as const,
                downloadedBytes: 12_000_000,
                totalBytes: 12_000_000,
                percent: 100,
                staged: false,
                downloading: true,
            })),
        };

        renderCard(service, launcher as unknown as AndroidUpdateLauncher);

        expect(await screen.findByText(/Verifying downloaded update/i)).toBeInTheDocument();
        expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it('renders native byte progress and preserves a manual installer retry', async () => {
        let listener: ((status: AndroidUpdateStatus) => void) | undefined;
        const launcher = {
            isNativeAndroid: () => true,
            downloadAndInstall: vi.fn(async () => downloadingStatus),
            getUpdateStatus: vi.fn(async () => ({...downloadingStatus, phase: 'idle' as const, downloading: false})),
            addListener: vi.fn(async (callback: (status: AndroidUpdateStatus) => void) => {
                listener = callback;
                return {remove: vi.fn(async () => undefined)};
            }),
            installPending: vi.fn(async () => ({
                ...downloadingStatus,
                phase: 'ready' as const,
                downloadedBytes: 12_000_000,
                percent: 100,
                staged: true,
                downloading: false,
            })),
        };

        renderCard({check: vi.fn()} as AndroidUpdateService, launcher as unknown as AndroidUpdateLauncher);
        await waitFor(() => expect(listener).toBeDefined());
        await act(async () => listener?.({...downloadingStatus, downloadedBytes: 6_000_000, percent: 50}));

        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText(/6 MB of 11 MB/)).toBeInTheDocument();

        await act(async () => listener?.({
            ...downloadingStatus,
            phase: 'ready',
            downloadedBytes: 12_000_000,
            percent: 100,
            staged: true,
            downloading: false,
        }));
        expect(screen.getByRole('button', {name: 'Install update'})).toBeInTheDocument();
    });

    it('does not contact GitHub until the user taps the manual check', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => downloadingStatus)};
        renderCard(service, launcher);
        expect(service.check).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        await screen.findByText('Version 1.1.0 is available.');
        expect(service.check).toHaveBeenCalledTimes(1);
    });

    it('requires confirmation before starting the native download', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => downloadingStatus)};
        renderCard(service, launcher);
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        fireEvent.click(await screen.findByRole('button', {name: 'Download update'}));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(launcher.downloadAndInstall).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Download update'}));
        await waitFor(() => expect(launcher.downloadAndInstall).toHaveBeenCalledWith({
            url: update.downloadUrl,
            expectedSha256: update.sha256,
            expectedSize: update.assetSize,
            expectedVersionName: update.versionName,
            expectedVersionCode: update.versionCode,
        }));
    });

    it('blocks update activity throughout an active workout', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => downloadingStatus)};
        renderCard(service, launcher, 'active-workout');
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        expect(await screen.findByText(/Finish or abandon the active workout/)).toBeInTheDocument();
        expect(service.check).not.toHaveBeenCalled();
        expect(launcher.downloadAndInstall).not.toHaveBeenCalled();
    });
});
