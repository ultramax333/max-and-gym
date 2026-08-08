package io.github.ultramax333.maxandgym;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class RestAlarmSchedulerTest {
    @Test
    public void acceptsOnlyTheCurrentGenerationAtOrAfterItsDeadline() {
        String timerId = "timer-1";
        long deadline = 1_000L;
        String generation = "timer-1:1000";

        assertTrue(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline, generation, deadline - 1L));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, timerId, deadline - 500L, "timer-1:500", deadline));
        assertFalse(RestAlarmScheduler.matchesDelivery(timerId, deadline, generation, "timer-2", deadline, generation, deadline));
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
