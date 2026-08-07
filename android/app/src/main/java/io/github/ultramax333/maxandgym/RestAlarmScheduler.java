package io.github.ultramax333.maxandgym;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

final class RestAlarmScheduler {
    static final String PREFS = "max_gym_rest_alarm";
    static final String EXTRA_TIMER_ID = "timerId";
    static final String EXTRA_SESSION_ID = "sessionId";
    static final String EXTRA_ENDS_AT = "endsAtEpochMs";
    static final String EXTRA_GENERATION = "generation";
    static final String ACTION_FIRE = "io.github.ultramax333.maxandgym.REST_ALARM_FIRE";
    static final String ACTION_OPEN = "io.github.ultramax333.maxandgym.REST_ALARM_OPEN";
    static final String ACTION_STOP = "io.github.ultramax333.maxandgym.REST_ALARM_STOP";
    private static final String KEY_TIMER_ID = "scheduledTimerId";
    private static final String KEY_SESSION_ID = "scheduledSessionId";
    private static final String KEY_ENDS_AT = "scheduledEndsAt";
    private static final String KEY_EXACT = "scheduledExact";
    private static final String KEY_GENERATION = "scheduledGeneration";
    static final String KEY_RINGING_TIMER_ID = "ringingTimerId";
    static final String KEY_RINGING_GENERATION = "ringingGeneration";
    static final String KEY_LAST_ACTION = "lastAction";
    static final String KEY_LAST_ACTION_TIMER_ID = "lastActionTimerId";
    static final String KEY_LAST_ACTION_AT = "lastActionAt";
    static final String KEY_LAST_ACTION_ENDS_AT = "lastActionEndsAt";
    static final String KEY_LAST_ACTION_GENERATION = "lastActionGeneration";

    private RestAlarmScheduler() {}

    static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    static boolean schedule(Context context, String timerId, String sessionId, long endsAtEpochMs, String generation) {
        SharedPreferences preferences = preferences(context);
        String previousTimerId = preferences.getString(KEY_TIMER_ID, null);
        if (previousTimerId != null && !previousTimerId.equals(timerId)) cancel(context, previousTimerId);
        String ringingTimerId = preferences.getString(KEY_RINGING_TIMER_ID, null);
        String ringingGeneration = preferences.getString(KEY_RINGING_GENERATION, null);
        if (timerId.equals(ringingTimerId) && !generation.equals(ringingGeneration)) {
            context.stopService(new Intent(context, RestAlarmService.class));
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return false;
        PendingIntent operation = alarmPendingIntent(context, timerId, sessionId, endsAtEpochMs, generation, PendingIntent.FLAG_UPDATE_CURRENT);
        long triggerAt = Math.max(System.currentTimeMillis() + 250L, endsAtEpochMs);
        boolean exact = canScheduleExact(context);
        // Publish the new identity before replacing the PendingIntent. A broadcast
        // already dequeued from the previous generation must fail validation.
        preferences.edit().putString(KEY_TIMER_ID, timerId).putString(KEY_SESSION_ID, sessionId).putLong(KEY_ENDS_AT, endsAtEpochMs).putString(KEY_GENERATION, generation).putBoolean(KEY_EXACT, exact).apply();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (exact) alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, operation);
            else alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, operation);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, operation);
        }
        return true;
    }

    static void cancel(Context context, String requestedTimerId) {
        SharedPreferences preferences = preferences(context);
        String storedTimerId = preferences.getString(KEY_TIMER_ID, null);
        if (requestedTimerId != null && storedTimerId != null && !requestedTimerId.equals(storedTimerId)) return;
        String timerId = requestedTimerId != null ? requestedTimerId : storedTimerId;
        if (timerId != null) {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            PendingIntent operation = alarmPendingIntent(context, timerId, preferences.getString(KEY_SESSION_ID, ""), preferences.getLong(KEY_ENDS_AT, 0L), preferences.getString(KEY_GENERATION, ""), PendingIntent.FLAG_NO_CREATE);
            if (alarmManager != null && operation != null) alarmManager.cancel(operation);
            if (operation != null) operation.cancel();
        }
        preferences.edit().remove(KEY_TIMER_ID).remove(KEY_SESSION_ID).remove(KEY_ENDS_AT).remove(KEY_GENERATION).remove(KEY_EXACT).apply();
        if (timerId != null && timerId.equals(preferences.getString(KEY_RINGING_TIMER_ID, null))) {
            context.stopService(new Intent(context, RestAlarmService.class));
        }
    }

    static void restore(Context context) {
        SharedPreferences preferences = preferences(context);
        String timerId = preferences.getString(KEY_TIMER_ID, null);
        String sessionId = preferences.getString(KEY_SESSION_ID, null);
        long endsAt = preferences.getLong(KEY_ENDS_AT, 0L);
        String generation = preferences.getString(KEY_GENERATION, null);
        if (timerId == null || sessionId == null || generation == null) {
            cancel(context, timerId);
            return;
        }
        schedule(context, timerId, sessionId, endsAt, generation);
    }

    static boolean isCurrentDelivery(Context context, String timerId, long endsAtEpochMs, String generation, long nowEpochMs) {
        SharedPreferences preferences = preferences(context);
        return matchesDelivery(
            preferences.getString(KEY_TIMER_ID, null),
            preferences.getLong(KEY_ENDS_AT, 0L),
            preferences.getString(KEY_GENERATION, null),
            timerId,
            endsAtEpochMs,
            generation,
            nowEpochMs
        );
    }

    static boolean matchesDelivery(String storedTimerId, long storedEndsAtEpochMs, String storedGeneration, String timerId, long endsAtEpochMs, String generation, long nowEpochMs) {
        return timerId != null
            && timerId.equals(storedTimerId)
            && endsAtEpochMs > 0L
            && endsAtEpochMs == storedEndsAtEpochMs
            && generation != null
            && generation.equals(storedGeneration)
            && nowEpochMs >= storedEndsAtEpochMs;
    }

    static boolean isCurrentExact(Context context, String timerId, long endsAtEpochMs, String generation) {
        return isCurrentDelivery(context, timerId, endsAtEpochMs, generation, System.currentTimeMillis()) && preferences(context).getBoolean(KEY_EXACT, false);
    }

    static void markAction(Context context, String action, String timerId, long endsAtEpochMs, String generation) {
        long occurredAt = System.currentTimeMillis();
        preferences(context).edit()
            .putString(KEY_LAST_ACTION, action)
            .putString(KEY_LAST_ACTION_TIMER_ID, timerId)
            .putLong(KEY_LAST_ACTION_AT, occurredAt)
            .putLong(KEY_LAST_ACTION_ENDS_AT, endsAtEpochMs)
            .putString(KEY_LAST_ACTION_GENERATION, generation)
            .apply();
        RestAlarmPlugin.emitAction(action, timerId, occurredAt, endsAtEpochMs, generation);
    }

    static void clearScheduled(Context context, String timerId, long endsAtEpochMs, String generation) {
        if (!isCurrentDelivery(context, timerId, endsAtEpochMs, generation, System.currentTimeMillis())) return;
        preferences(context).edit().remove(KEY_TIMER_ID).remove(KEY_SESSION_ID).remove(KEY_ENDS_AT).remove(KEY_GENERATION).remove(KEY_EXACT).apply();
    }

    static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static PendingIntent alarmPendingIntent(Context context, String timerId, String sessionId, long endsAtEpochMs, String generation, int lookupFlag) {
        Intent intent = new Intent(context, RestAlarmReceiver.class)
            .setAction(ACTION_FIRE)
            .putExtra(EXTRA_TIMER_ID, timerId)
            .putExtra(EXTRA_SESSION_ID, sessionId)
            .putExtra(EXTRA_ENDS_AT, endsAtEpochMs)
            .putExtra(EXTRA_GENERATION, generation);
        int flags = lookupFlag | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, timerId.hashCode(), intent, flags);
    }
}
