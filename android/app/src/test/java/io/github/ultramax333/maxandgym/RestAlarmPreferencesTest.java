package io.github.ultramax333.maxandgym;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class RestAlarmPreferencesTest {
    @Test
    public void acceptsOnlySupportedDurations() {
        assertEquals(3, RestAlarmPreferences.DEFAULT_DURATION_SECONDS);
        assertEquals(3, RestAlarmPreferences.sanitizeDuration(3));
        assertEquals(5, RestAlarmPreferences.sanitizeDuration(5));
        assertEquals(20, RestAlarmPreferences.sanitizeDuration(20));
        assertEquals(RestAlarmPreferences.DEFAULT_DURATION_SECONDS, RestAlarmPreferences.sanitizeDuration(0));
        assertEquals(RestAlarmPreferences.DEFAULT_DURATION_SECONDS, RestAlarmPreferences.sanitizeDuration(120));
    }

    @Test
    public void leadIsZeroWithoutSamples() {
        assertEquals(0L, RestAlarmPreferences.leadFromSamples(new long[0]));
        assertEquals(0L, RestAlarmPreferences.leadFromSamples(null));
    }

    @Test
    public void leadIsTheMedianOfTheSamples() {
        assertEquals(840L, RestAlarmPreferences.leadFromSamples(new long[]{840L}));
        assertEquals(700L, RestAlarmPreferences.leadFromSamples(new long[]{900L, 200L, 700L}));
        assertEquals(600L, RestAlarmPreferences.leadFromSamples(new long[]{500L, 700L}));
        assertEquals(700L, RestAlarmPreferences.leadFromSamples(new long[]{5_000L, 650L, 700L, 40L, 800L}));
    }

    @Test
    public void leadIsClampedToTheMaximumLead() {
        assertEquals(RestAlarmScheduler.MAX_LEAD_MS, RestAlarmPreferences.leadFromSamples(new long[]{9_000L, 12_000L, 8_000L}));
        assertEquals(0L, RestAlarmPreferences.leadFromSamples(new long[]{-300L}));
    }

    @Test
    public void parsesAndFormatsSamplesKeepingTheNewestFive() {
        assertArrayEquals(new long[0], RestAlarmPreferences.parseSamples(""));
        assertArrayEquals(new long[0], RestAlarmPreferences.parseSamples(null));
        assertArrayEquals(new long[]{100L, 200L}, RestAlarmPreferences.parseSamples("100,200"));
        assertArrayEquals(new long[]{2L, 3L, 4L, 5L, 6L}, RestAlarmPreferences.parseSamples("1,2,3,4,5,6"));
        assertArrayEquals(new long[]{100L, 300L}, RestAlarmPreferences.parseSamples("100,abc,300,-5,999999"));
        assertEquals("100,200,300", RestAlarmPreferences.formatSamples(new long[]{100L, 200L, 300L}));
        assertEquals("", RestAlarmPreferences.formatSamples(new long[0]));
    }

    @Test
    public void acceptsOnlyBuiltInToneModes() {
        assertEquals("classic", RestAlarmPreferences.sanitizeTone("classic"));
        assertEquals("urgent", RestAlarmPreferences.sanitizeTone("urgent"));
        assertEquals("silent", RestAlarmPreferences.sanitizeTone("silent"));
        assertEquals(RestAlarmPreferences.DEFAULT_TONE, RestAlarmPreferences.sanitizeTone("custom-file"));
    }
}
