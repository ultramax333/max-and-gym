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
    private static final String KEY_DELAY_SAMPLES = "alarmDelaySamples";
    static final int MAX_DELAY_SAMPLES = 5;
    static final long MAX_PLAUSIBLE_DELAY_MS = 60_000L;

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

    // Measured delay between the AlarmManager trigger time and the first tone, newest sample last.
    static long[] delaySamples(Context context) {
        return parseSamples(RestAlarmScheduler.preferences(context).getString(KEY_DELAY_SAMPLES, ""));
    }

    static void recordDelaySample(Context context, long delayMs) {
        if (delayMs < 0L || delayMs > MAX_PLAUSIBLE_DELAY_MS) return;
        long[] samples = delaySamples(context);
        int keep = Math.min(samples.length, MAX_DELAY_SAMPLES - 1);
        long[] next = new long[keep + 1];
        System.arraycopy(samples, samples.length - keep, next, 0, keep);
        next[keep] = delayMs;
        RestAlarmScheduler.preferences(context).edit().putString(KEY_DELAY_SAMPLES, formatSamples(next)).apply();
    }

    // Last measured delay, or -1 when there is no sample yet.
    static long lastDelayMillis(Context context) {
        long[] samples = delaySamples(context);
        return samples.length == 0 ? -1L : samples[samples.length - 1];
    }

    // How early to schedule the next alarm: median of the recent samples, clamped to [0, MAX_LEAD_MS].
    static long leadMillis(Context context) {
        return leadFromSamples(delaySamples(context));
    }

    static long leadFromSamples(long[] samples) {
        if (samples == null || samples.length == 0) return 0L;
        long[] sorted = samples.clone();
        java.util.Arrays.sort(sorted);
        int middle = sorted.length / 2;
        long median = sorted.length % 2 == 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2L;
        return Math.max(0L, Math.min(RestAlarmScheduler.MAX_LEAD_MS, median));
    }

    static long[] parseSamples(String stored) {
        if (stored == null || stored.isEmpty()) return new long[0];
        String[] parts = stored.split(",");
        long[] parsed = new long[parts.length];
        int count = 0;
        for (String part : parts) {
            try {
                long value = Long.parseLong(part.trim());
                if (value >= 0L && value <= MAX_PLAUSIBLE_DELAY_MS) parsed[count++] = value;
            } catch (NumberFormatException ignored) {
                // Skip malformed entries.
            }
        }
        int keep = Math.min(count, MAX_DELAY_SAMPLES);
        long[] samples = new long[keep];
        System.arraycopy(parsed, count - keep, samples, 0, keep);
        return samples;
    }

    static String formatSamples(long[] samples) {
        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < samples.length; index++) {
            if (index > 0) builder.append(',');
            builder.append(samples[index]);
        }
        return builder.toString();
    }

    static int sanitizeDuration(int value) {
        return value == 5 || value == 10 || value == 20 || value == 30 ? value : DEFAULT_DURATION_SECONDS;
    }

    static String sanitizeTone(String value) {
        return "classic".equals(value) || "urgent".equals(value) || "silent".equals(value) ? value : DEFAULT_TONE;
    }
}
