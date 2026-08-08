import 'fake-indexeddb/auto';
import React from 'react';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {DBContext} from '../../context/dbContext';
import {ANDROID_DIAGNOSTIC_ALARM_ID} from '../../diagnostics/androidRuntime';
import DiagnosticsPage from './DiagnosticsPage';

const mocks = vi.hoisted(() => {
    const recover = vi.fn();
    return {
        recover,
        workoutService: {recover},
        cancel: vi.fn(),
        schedule: vi.fn(),
    };
});

vi.mock('../../components/layout', () => ({default: ({children}: {children: React.ReactNode}) => <main>{children}</main>}));
vi.mock('../../pwa/PwaContext', () => ({usePwa: () => ({registered: false, controlling: false, updateWaiting: false, offlineReady: false, recheck: vi.fn()})}));
vi.mock('../../workout/useWorkoutService', () => ({useWorkoutService: () => mocks.workoutService}));
vi.mock('../../native/restAlarmGateway', () => ({
    restAlarmGateway: {
        isNativeAndroid: () => true,
        getCapabilities: async () => ({nativeAndroid: true, notificationPermission: 'granted', exactAlarmAllowed: true}),
        requestNotificationPermission: vi.fn(),
        requestExactAlarmPermission: vi.fn(),
        cancel: mocks.cancel,
        schedule: mocks.schedule,
        consumeLastAction: vi.fn(),
        addActionListener: vi.fn(),
    },
}));

describe('DiagnosticsPage Android controls', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('shows Android permissions, recovery state and a guarded short alarm test', async () => {
        mocks.recover.mockResolvedValue(undefined);
        mocks.cancel.mockResolvedValue(undefined);
        mocks.schedule.mockResolvedValue({scheduled: true, exactAlarmAllowed: true});

        render(<MemoryRouter><DBContext.Provider value={{}}><DiagnosticsPage/></DBContext.Provider></MemoryRouter>);

        expect(await screen.findByRole('heading', {name: 'Android alarm and recovery'})).toBeInTheDocument();
        expect(await screen.findByText('Not inspected. Max & Gym does not request a battery-optimization exemption.')).toBeInTheDocument();
        expect(screen.getByText('No active or paused workout is persisted.')).toBeInTheDocument();

        const alarmTest = screen.getByRole('button', {name: 'Run 5-second alarm test'});
        await waitFor(() => expect(alarmTest).toBeEnabled());
        await userEvent.click(alarmTest);

        expect(await screen.findByText(/Test alarm scheduled in 5 seconds/)).toBeInTheDocument();
        expect(mocks.cancel).toHaveBeenCalledWith(ANDROID_DIAGNOSTIC_ALARM_ID);
        expect(mocks.schedule).toHaveBeenCalledWith(expect.objectContaining({id: ANDROID_DIAGNOSTIC_ALARM_ID, sessionId: 'diagnostic-only'}));
    });
});
