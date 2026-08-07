package io.github.ultramax333.maxandgym;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class RestAlarmService extends Service {
    static final int NOTIFICATION_ID = 42017;
    private static final String CHANNEL_ID = "max_gym_rest_alarm_v1";
    private static final String FALLBACK_CHANNEL_ID = "max_gym_rest_alarm_fallback_v1";
    private static final long ALARM_DURATION_MS = 10_000L;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private long stopAt;
    private String activeTimerId;
    private final Runnable beep = new Runnable() {
        @Override public void run() {
            if (System.currentTimeMillis() >= stopAt || toneGenerator == null) {
                stopSelf();
                return;
            }
            toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP2, 350);
            handler.postDelayed(this, 500L);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String timerId = intent == null ? null : intent.getStringExtra(RestAlarmScheduler.EXTRA_TIMER_ID);
        activeTimerId = timerId;
        RestAlarmScheduler.preferences(this).edit().putString(RestAlarmScheduler.KEY_RINGING_TIMER_ID, timerId).apply();
        Notification notification = buildNotification(timerId);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        startAlarmFeedback();
        return START_NOT_STICKY;
    }

    private void startAlarmFeedback() {
        stopFeedback();
        stopAt = System.currentTimeMillis() + ALARM_DURATION_MS;
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MaxGym:RestAlarm");
            wakeLock.acquire(ALARM_DURATION_MS + 2_000L);
        }
        toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
        vibrator = getVibrator();
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0L, 350L, 150L};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            else vibrator.vibrate(pattern, 0);
        }
        handler.post(beep);
        handler.postDelayed(this::stopSelf, ALARM_DURATION_MS);
    }

    private Notification buildNotification(String timerId) {
        Intent openIntent = new Intent(this, MainActivity.class)
            .setAction(RestAlarmScheduler.ACTION_OPEN)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(this, 42018, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stopIntent = new Intent(this, RestAlarmActionReceiver.class)
            .setAction(RestAlarmScheduler.ACTION_STOP)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId);
        PendingIntent stop = PendingIntent.getBroadcast(this, 42019, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_rest_alarm)
            .setContentTitle("Rest complete")
            .setContentText("Time for your next set.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setOngoing(true)
            .addAction(0, "Stop", stop)
            .build();
    }

    static void showFallbackNotification(Context context, String timerId) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(FALLBACK_CHANNEL_ID, "Rest timer fallback", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Rest timer notification when exact alarms are unavailable");
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
            channel.enableVibration(true);
            manager.createNotificationChannel(channel);
        }
        Intent openIntent = new Intent(context, MainActivity.class)
            .setAction(RestAlarmScheduler.ACTION_OPEN)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(context, 42018, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(context, FALLBACK_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_rest_alarm)
            .setContentTitle("Rest complete")
            .setContentText("Time for your next set. Exact alarm access is disabled.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build();
        manager.notify(NOTIFICATION_ID, notification);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Rest timer alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("10-second alerts when a workout rest timer ends");
        channel.setLightColor(Color.parseColor("#55D6BE"));
        channel.enableLights(true);
        channel.enableVibration(false);
        channel.setSound(null, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    @SuppressWarnings("deprecation")
    private Vibrator getVibrator() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager manager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return manager == null ? null : manager.getDefaultVibrator();
        }
        return (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    }

    private void stopFeedback() {
        handler.removeCallbacksAndMessages(null);
        if (toneGenerator != null) {
            toneGenerator.stopTone();
            toneGenerator.release();
            toneGenerator = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }

    @Override
    public void onDestroy() {
        stopFeedback();
        String ringingTimerId = RestAlarmScheduler.preferences(this).getString(RestAlarmScheduler.KEY_RINGING_TIMER_ID, null);
        if (activeTimerId != null && activeTimerId.equals(ringingTimerId)) {
            RestAlarmScheduler.preferences(this).edit().remove(RestAlarmScheduler.KEY_RINGING_TIMER_ID).apply();
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        super.onDestroy();
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }
}
