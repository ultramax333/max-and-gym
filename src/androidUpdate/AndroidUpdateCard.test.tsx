import React from 'react';
import {vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {DBContext} from '../context/dbContext';
import {DexieDB} from '../db/db';
import {AndroidUpdateCard} from './AndroidUpdateCard';
import {AndroidUpdateLauncher} from './androidUpdateLauncher';
import {AndroidUpdateService} from './GitHubReleaseUpdateService';

const update = {
    versionName: '1.1.0',
    versionCode: 120000010,
    downloadUrl: 'https://github.com/ultramax333/max-and-gym/releases/download/v1.1.0/max-and-gym-v1.1.0-120000010-release.apk',
    releaseUrl: 'https://github.com/ultramax333/max-and-gym/releases/tag/v1.1.0',
    assetName: 'max-and-gym-v1.1.0-120000010-release.apk',
    assetSize: 12_000_000,
    immutable: true,
};

function renderCard(service: AndroidUpdateService, launcher: AndroidUpdateLauncher, block?: 'active-workout' | 'critical-write') {
    return render(<DBContext.Provider value={{db: {} as DexieDB}}><AndroidUpdateCard service={service} launcher={launcher} readBlockReason={async () => block}/></DBContext.Provider>);
}

describe('AndroidUpdateCard', () => {
    it('does not contact GitHub until the user taps the manual check', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => ({status: 'downloading' as const}))};
        renderCard(service, launcher);
        expect(service.check).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        await screen.findByText('Version 1.1.0 is available.');
        expect(service.check).toHaveBeenCalledTimes(1);
    });

    it('requires confirmation before starting the native download', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => ({status: 'downloading' as const}))};
        renderCard(service, launcher);
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        fireEvent.click(await screen.findByRole('button', {name: 'Download update'}));
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(launcher.downloadAndInstall).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name: 'Download update'}));
        await waitFor(() => expect(launcher.downloadAndInstall).toHaveBeenCalledWith(update.downloadUrl));
    });

    it('blocks update activity throughout an active workout', async () => {
        const service = {check: vi.fn(async () => ({status: 'available' as const, currentVersion: '1.0.0-test', release: update}))};
        const launcher = {isNativeAndroid: () => true, downloadAndInstall: vi.fn(async () => ({status: 'downloading' as const}))};
        renderCard(service, launcher, 'active-workout');
        fireEvent.click(screen.getByRole('button', {name: 'Check for update'}));
        expect(await screen.findByText(/Finish or abandon the active workout/)).toBeInTheDocument();
        expect(service.check).not.toHaveBeenCalled();
        expect(launcher.downloadAndInstall).not.toHaveBeenCalled();
    });
});
