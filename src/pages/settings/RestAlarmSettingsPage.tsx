import React from 'react';
import Layout from '../../components/layout';
import {ScreenContainer} from '../../components/ui/UiPrimitives';
import {RestAlarmSettingsCard} from '../../native/RestAlarmSettingsCard';

export function RestAlarmSettingsPage() {
    return <Layout title="Rest alarm" hideNav><ScreenContainer><RestAlarmSettingsCard/></ScreenContainer></Layout>;
}
