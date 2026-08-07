package io.github.ultramax333.maxandgym;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RestAlarmActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!RestAlarmScheduler.ACTION_STOP.equals(intent.getAction())) return;
        String timerId = intent.getStringExtra(RestAlarmScheduler.EXTRA_TIMER_ID);
        if (timerId == null || !timerId.equals(RestAlarmScheduler.preferences(context).getString(RestAlarmScheduler.KEY_RINGING_TIMER_ID, null))) return;
        RestAlarmScheduler.markAction(context, "stop", timerId);
        context.stopService(new Intent(context, RestAlarmService.class));
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(RestAlarmService.NOTIFICATION_ID);
    }
}
