package io.github.ultramax333.maxandgym;

import android.content.Intent;
import android.app.NotificationManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RestAlarmPlugin.class);
        registerPlugin(AndroidUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        rememberAlarmAction(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        rememberAlarmAction(intent);
    }

    private void rememberAlarmAction(Intent intent) {
        if (intent == null || !RestAlarmScheduler.ACTION_OPEN.equals(intent.getAction())) return;
        RestAlarmScheduler.markAction(
            this,
            "open",
            intent.getStringExtra(RestAlarmScheduler.EXTRA_TIMER_ID),
            intent.getLongExtra(RestAlarmScheduler.EXTRA_ENDS_AT, 0L),
            intent.getStringExtra(RestAlarmScheduler.EXTRA_GENERATION)
        );
        stopService(new Intent(this, RestAlarmService.class));
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(RestAlarmService.NOTIFICATION_ID);
    }
}
