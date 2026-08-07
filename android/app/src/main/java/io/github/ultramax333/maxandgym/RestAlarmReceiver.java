package io.github.ultramax333.maxandgym;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

public class RestAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String timerId = intent.getStringExtra(RestAlarmScheduler.EXTRA_TIMER_ID);
        long endsAtEpochMs = intent.getLongExtra(RestAlarmScheduler.EXTRA_ENDS_AT, 0L);
        String generation = intent.getStringExtra(RestAlarmScheduler.EXTRA_GENERATION);
        if (!RestAlarmScheduler.isCurrentDelivery(context, timerId, endsAtEpochMs, generation, System.currentTimeMillis())) return;
        boolean exact = RestAlarmScheduler.isCurrentExact(context, timerId, endsAtEpochMs, generation);
        RestAlarmScheduler.markAction(context, "fired", timerId, endsAtEpochMs, generation);
        RestAlarmScheduler.clearScheduled(context, timerId, endsAtEpochMs, generation);
        if (!exact) {
            RestAlarmService.showFallbackNotification(context, timerId, endsAtEpochMs, generation);
            return;
        }
        Intent serviceIntent = new Intent(context, RestAlarmService.class)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation);
        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (IllegalStateException | SecurityException error) {
            RestAlarmService.showFallbackNotification(context, timerId, endsAtEpochMs, generation);
        }
    }
}
