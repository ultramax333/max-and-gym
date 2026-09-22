import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';
import {EquipmentEditorDialog} from './EquipmentEditorDialog';
import {LibraryExercise} from './types';
import seed from './reviewed-exercises.json';

const repository = vi.hoisted(() => ({updatePreference: vi.fn(), resetEquipmentPreference: vi.fn()}));
vi.mock('./useExerciseCatalog', () => ({useExerciseCatalog: () => repository}));
vi.mock('../diagnostics/service', () => ({recordDiagnostic: vi.fn()}));
const exercise = {...seed[0], favourite: false, effectiveNeverSuggest: false, accessDifficulty: 'normal', requiredStationCount: 1} as LibraryExercise;
beforeEach(() => vi.resetAllMocks());

it('keeps the editor open on a failed save, explains the error and allows retry', async () => {
    repository.updatePreference.mockRejectedValueOnce(new DOMException('synthetic', 'QuotaExceededError')).mockResolvedValueOnce(undefined);
    const close = vi.fn();
    const saved = vi.fn();
    render(<EquipmentEditorDialog exercise={exercise} open onClose={close} onSaved={saved}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Save', exact: true}));
    await screen.findByText(/Could not save equipment/);
    expect(close).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name: 'Save', exact: true}));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(saved).toHaveBeenCalledTimes(1);
});

it('disables save and restore while a write is pending', async () => {
    let resolve!: () => void;
    repository.updatePreference.mockImplementation(() => new Promise<void>(done => { resolve = done; }));
    render(<EquipmentEditorDialog exercise={exercise} open onClose={vi.fn()} onSaved={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Save', exact: true}));
    expect(screen.getByRole('button', {name: 'Saving…'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Restore catalogue defaults'})).toBeDisabled();
    expect(screen.getByRole('combobox', {name: 'Required equipment'})).toHaveAttribute('aria-disabled', 'true');
    expect(repository.updatePreference).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(screen.getByRole('button', {name: 'Save', exact: true})).toBeEnabled());
});
