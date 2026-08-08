package io.github.ultramax333.maxandgym;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class RestAlarmPreferencesTest {
    @Test
    public void acceptsOnlySupportedDurations() {
        assertEquals(5, RestAlarmPreferences.sanitizeDuration(5));
        assertEquals(20, RestAlarmPreferences.sanitizeDuration(20));
        assertEquals(RestAlarmPreferences.DEFAULT_DURATION_SECONDS, RestAlarmPreferences.sanitizeDuration(0));
        assertEquals(RestAlarmPreferences.DEFAULT_DURATION_SECONDS, RestAlarmPreferences.sanitizeDuration(120));
    }

    @Test
    public void acceptsOnlyBuiltInToneModes() {
        assertEquals("classic", RestAlarmPreferences.sanitizeTone("classic"));
        assertEquals("urgent", RestAlarmPreferences.sanitizeTone("urgent"));
        assertEquals("silent", RestAlarmPreferences.sanitizeTone("silent"));
        assertEquals(RestAlarmPreferences.DEFAULT_TONE, RestAlarmPreferences.sanitizeTone("custom-file"));
    }
}
