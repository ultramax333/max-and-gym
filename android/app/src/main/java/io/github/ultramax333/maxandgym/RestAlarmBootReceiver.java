package io.github.ultramax333.maxandgym;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RestAlarmBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            RestAlarmScheduler.restore(context);
        }
    }
}
