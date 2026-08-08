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
    private static final String FALLBACK_CHANNEL_PREFIX = "max_gym_rest_alarm_fallback_v2_";
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private long stopAt;
    private String activeTimerId;
    private String activeGeneration;
    private int activeTone = ToneGenerator.TONE_PROP_BEEP2;
    private final Runnable beep = new Runnable() {
        @Override public void run() {
            if (System.currentTimeMillis() >= stopAt) {
                stopSelf();
                return;
            }
            if (toneGenerator != null) toneGenerator.startTone(activeTone, 350);
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
        long endsAtEpochMs = intent == null ? 0L : intent.getLongExtra(RestAlarmScheduler.EXTRA_ENDS_AT, 0L);
        String generation = intent == null ? null : intent.getStringExtra(RestAlarmScheduler.EXTRA_GENERATION);
        String sessionId = intent == null ? null : intent.getStringExtra(RestAlarmScheduler.EXTRA_SESSION_ID);
        activeTimerId = timerId;
        activeGeneration = generation;
        RestAlarmScheduler.preferences(this).edit().putString(RestAlarmScheduler.KEY_RINGING_TIMER_ID, timerId).putString(RestAlarmScheduler.KEY_RINGING_GENERATION, generation).apply();
        Notification notification = buildNotification(timerId, sessionId, endsAtEpochMs, generation);
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
        long alarmDurationMs = RestAlarmPreferences.durationSeconds(this) * 1_000L;
        stopAt = System.currentTimeMillis() + alarmDurationMs;
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MaxGym:RestAlarm");
            wakeLock.acquire(alarmDurationMs + 2_000L);
        }
        String tone = RestAlarmPreferences.tone(this);
        activeTone = "urgent".equals(tone) ? ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD : ToneGenerator.TONE_PROP_BEEP2;
        toneGenerator = "silent".equals(tone) ? null : new ToneGenerator(AudioManager.STREAM_ALARM, 100);
        vibrator = RestAlarmPreferences.vibrationEnabled(this) ? getVibrator() : null;
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0L, 350L, 150L};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            else vibrator.vibrate(pattern, 0);
        }
        handler.post(beep);
        handler.postDelayed(this::stopSelf, alarmDurationMs);
    }

    private Notification buildNotification(String timerId, String sessionId, long endsAtEpochMs, String generation) {
        Intent openIntent = new Intent(this, MainActivity.class)
            .setAction(RestAlarmScheduler.ACTION_OPEN)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(this, 42018, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stopIntent = new Intent(this, RestAlarmActionReceiver.class)
            .setAction(RestAlarmScheduler.ACTION_STOP)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation);
        PendingIntent stop = PendingIntent.getBroadcast(this, 42019, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent snoozeIntent = new Intent(this, RestAlarmActionReceiver.class)
            .setAction(RestAlarmScheduler.ACTION_SNOOZE)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_SESSION_ID, sessionId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation);
        PendingIntent snooze = PendingIntent.getBroadcast(this, 42020, snoozeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
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
            .addAction(0, "+30 s", snooze)
            .build();
    }

    static void showFallbackNotification(Context context, String timerId, String sessionId, long endsAtEpochMs, String generation) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        String tone = RestAlarmPreferences.tone(context);
        boolean vibrationEnabled = RestAlarmPreferences.vibrationEnabled(context);
        String channelId = FALLBACK_CHANNEL_PREFIX + tone + (vibrationEnabled ? "_vibrate" : "_quiet");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(channelId, "Rest timer fallback", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Rest timer notification when exact alarms are unavailable");
            channel.setSound("silent".equals(tone) ? null : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
            channel.enableVibration(vibrationEnabled);
            manager.createNotificationChannel(channel);
        }
        RestAlarmScheduler.preferences(context).edit().putString(RestAlarmScheduler.KEY_RINGING_TIMER_ID, timerId).putString(RestAlarmScheduler.KEY_RINGING_GENERATION, generation).apply();
        Intent openIntent = new Intent(context, MainActivity.class)
            .setAction(RestAlarmScheduler.ACTION_OPEN)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(context, 42018, openIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stopIntent = new Intent(context, RestAlarmActionReceiver.class)
            .setAction(RestAlarmScheduler.ACTION_STOP)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation);
        PendingIntent stop = PendingIntent.getBroadcast(context, 42019, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent snoozeIntent = new Intent(context, RestAlarmActionReceiver.class)
            .setAction(RestAlarmScheduler.ACTION_SNOOZE)
            .putExtra(RestAlarmScheduler.EXTRA_TIMER_ID, timerId)
            .putExtra(RestAlarmScheduler.EXTRA_SESSION_ID, sessionId)
            .putExtra(RestAlarmScheduler.EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(RestAlarmScheduler.EXTRA_GENERATION, generation);
        PendingIntent snooze = PendingIntent.getBroadcast(context, 42020, snoozeIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification notification = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_stat_rest_alarm)
            .setContentTitle("Rest complete")
            .setContentText("Time for your next set. Exact alarm access is disabled.")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setVibrate(vibrationEnabled ? new long[]{0L, 350L, 150L, 350L} : null)
            .setSound("silent".equals(tone) ? null : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
            .addAction(0, "Stop", stop)
            .addAction(0, "+30 s", snooze)
            .build();
        manager.notify(NOTIFICATION_ID, notification);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Rest timer alarms", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Customizable alerts when a workout rest timer ends");
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
        String ringingGeneration = RestAlarmScheduler.preferences(this).getString(RestAlarmScheduler.KEY_RINGING_GENERATION, null);
        if (activeTimerId != null && activeTimerId.equals(ringingTimerId) && activeGeneration != null && activeGeneration.equals(ringingGeneration)) {
            RestAlarmScheduler.preferences(this).edit().remove(RestAlarmScheduler.KEY_RINGING_TIMER_ID).remove(RestAlarmScheduler.KEY_RINGING_GENERATION).apply();
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        super.onDestroy();
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }
}
