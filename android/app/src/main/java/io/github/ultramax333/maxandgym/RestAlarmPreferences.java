package io.github.ultramax333.maxandgym;

import android.content.Context;
import android.content.SharedPreferences;

final class RestAlarmPreferences {
    static final int DEFAULT_DURATION_SECONDS = 10;
    static final boolean DEFAULT_VIBRATION_ENABLED = true;
    static final String DEFAULT_TONE = "classic";
    private static final String KEY_DURATION_SECONDS = "preferenceDurationSeconds";
    private static final String KEY_VIBRATION_ENABLED = "preferenceVibrationEnabled";
    private static final String KEY_TONE = "preferenceTone";

    private RestAlarmPreferences() {}

    static int durationSeconds(Context context) {
        return sanitizeDuration(RestAlarmScheduler.preferences(context).getInt(KEY_DURATION_SECONDS, DEFAULT_DURATION_SECONDS));
    }

    static boolean vibrationEnabled(Context context) {
        return RestAlarmScheduler.preferences(context).getBoolean(KEY_VIBRATION_ENABLED, DEFAULT_VIBRATION_ENABLED);
    }

    static String tone(Context context) {
        return sanitizeTone(RestAlarmScheduler.preferences(context).getString(KEY_TONE, DEFAULT_TONE));
    }

    static void save(Context context, int durationSeconds, boolean vibrationEnabled, String tone) {
        RestAlarmScheduler.preferences(context).edit()
            .putInt(KEY_DURATION_SECONDS, sanitizeDuration(durationSeconds))
            .putBoolean(KEY_VIBRATION_ENABLED, vibrationEnabled)
            .putString(KEY_TONE, sanitizeTone(tone))
            .apply();
    }

    static int sanitizeDuration(int value) {
        return value == 5 || value == 10 || value == 20 || value == 30 ? value : DEFAULT_DURATION_SECONDS;
    }

    static String sanitizeTone(String value) {
        return "classic".equals(value) || "urgent".equals(value) || "silent".equals(value) ? value : DEFAULT_TONE;
    }
}
