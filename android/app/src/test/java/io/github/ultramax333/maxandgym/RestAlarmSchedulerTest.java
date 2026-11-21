package io.github.ultramax333.maxandgym;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class RestAlarmSchedulerTest {
    @Test
    public void acceptsOnlyTheCurrentGenerationAtOrAfterItsDeadline() {
        String timerId = "timer-1";
        long deadline = 10_000L;
        String generation = "timer-1:10000";

        assertTrue(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline));
        assertTrue(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline + 5_000L));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline - 500L, "timer-1:500", deadline));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, "timer-2", deadline, generation, deadline));
    }

    @Test
    public void acceptsADeliveryEarlyByAtMostTheMaximumLead() {
        String timerId = "timer-1";
        long deadline = 10_000L;
        String generation = "timer-1:10000";
        long maxLead = RestAlarmScheduler.MAX_LEAD_MS;

        assertTrue(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline - 700L));
        assertTrue(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline - maxLead));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline - maxLead - 1L));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline - 6_000L));
    }

    @Test
    public void stillRejectsAnEarlyDeliveryOfAnotherTimerOrGeneration() {
        long deadline = 10_000L;
        assertFalse(RestAlarmScheduler.matchesDelivery("timer-1", deadline, "timer-1:10000", "timer-2", deadline, "timer-1:10000", deadline - 500L));
        assertFalse(RestAlarmScheduler.matchesDelivery("timer-1", deadline, "timer-1:10000", "timer-1", deadline - 500L, "timer-1:9500", deadline - 500L));
        assertFalse(RestAlarmScheduler.matchesDelivery("timer-1", deadline, "timer-1:10000", "timer-1", deadline, "timer-1:9500", deadline - 500L));
    }

    @Test
    public void rejectsAnOldDeliveryAfterTheSameTimerWasExtended() {
        assertFalse(RestAlarmScheduler.matchesDelivery(
            "timer-1",
            2_000L,
            "timer-1:2000",
            "timer-1",
            1_000L,
            "timer-1:1000",
            2_500L
        ));
    }

    @Test
    public void createsADeadlineBoundGenerationForSnooze() {
        assertTrue("timer-1:30000".equals(RestAlarmScheduler.generation("timer-1", 30_000L)));
    }
}
