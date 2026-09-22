import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react';
import {expect, it, vi} from 'vitest';
import {DBContext} from '../context/dbContext';
import {DexieDB} from '../db/db';
import {PwaProvider, usePwa} from './PwaContext';

const safety = vi.hoisted(() => vi.fn());
vi.mock('../androidUpdate/updateSafety', () => ({readAndroidUpdateBlockReason: safety}));
vi.mock('../diagnostics/service', () => ({recordDiagnostic: vi.fn()}));
function Control() {
    const state = usePwa();
    return <><button onClick={() => void state.applyUpdate()}>Check update</button><p>{state.updateMessage}</p></>;
}
it.each(['active-workout', 'critical-write'])('defers update for %s', async reason => {
    safety.mockResolvedValue(reason);
    render(<DBContext.Provider value={{db: {} as DexieDB}}><PwaProvider><Control/></PwaProvider></DBContext.Provider>);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Finish the active workout and any save or import/)).toBeInTheDocument();
});
it('fails closed when safety checks cannot read storage', async () => {
    safety.mockRejectedValue(new Error('test'));
    render(<DBContext.Provider value={{db: {} as DexieDB}}><PwaProvider><Control/></PwaProvider></DBContext.Provider>);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Could not check update safety/)).toBeInTheDocument();
});
