import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {RestAlarmGateway} from './restAlarmGateway';
import {RestAlarmSettingsCard} from './RestAlarmSettingsCard';

function gateway(nativeAndroid: boolean): RestAlarmGateway {
    return {
        isNativeAndroid: () => nativeAndroid,
        getCapabilities: vi.fn(),
        requestNotificationPermission: vi.fn(),
        requestExactAlarmPermission: vi.fn(),
        getPreferences: vi.fn().mockResolvedValue({durationSeconds: 20, vibrationEnabled: false, tone: 'urgent'}),
        setPreferences: vi.fn().mockImplementation(async (value) => value),
        schedule: vi.fn(),
        cancel: vi.fn(),
        consumeLastAction: vi.fn(),
        addActionListener: vi.fn(),
    };
}

describe('RestAlarmSettingsCard', () => {
    it('keeps Android-only controls honest in the browser', () => {
        render(<RestAlarmSettingsCard gateway={gateway(false)}/>);
        expect(screen.getByText(/available in the Android app/i)).toBeInTheDocument();
    });

    it('loads and saves native preferences locally', async () => {
        const nativeGateway = gateway(true);
        render(<RestAlarmSettingsCard gateway={nativeGateway}/>);
        await screen.findByText('20 seconds');
        fireEvent.click(screen.getByRole('button', {name: 'Save alarm settings'}));
        await waitFor(() => expect(nativeGateway.setPreferences).toHaveBeenCalledWith({durationSeconds: 20, vibrationEnabled: false, tone: 'urgent'}));
        expect(await screen.findByText(/saved locally/i)).toBeInTheDocument();
    });
});
