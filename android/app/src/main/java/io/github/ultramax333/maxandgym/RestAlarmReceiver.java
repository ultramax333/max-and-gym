package io.github.ultramax333.maxandgym;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class RestAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String timerId = intent.getStringExtra(RestAlarmScheduler.EXTRA_TIMER_ID);
        if (!RestAlarmScheduler.isCurrent(context, timerId)) return;
        boolean exact = RestAlarmScheduler.isCurrentExact(context, timerId);
        RestAlarmScheduler.markAction(context, "fired", timerId);
        RestAlarmScheduler.clearScheduled(context, timerId);
        if (!exact) {
            RestAlarmService.showFallbackNotification(context, timerId);
            return;
        }
        Intent serviceIntent = new Intent(context, RestAlarmService.class)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId);
        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (IllegalStateException | SecurityException error) {
            RestAlarmService.showFallbackNotification(context, timerId);
        }
    }
}
