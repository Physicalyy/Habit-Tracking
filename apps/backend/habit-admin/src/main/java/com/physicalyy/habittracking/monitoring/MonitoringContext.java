package com.physicalyy.habittracking.monitoring;

import java.time.LocalDateTime;
import java.util.UUID;

public final class MonitoringContext {

    private static final ThreadLocal<RequestTrace> CURRENT = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> SUPPRESSED = ThreadLocal.withInitial(() -> false);

    private MonitoringContext() {
    }

    public static RequestTrace start(String requestId, LocalDateTime startTime, long startNanos) {
        RequestTrace trace = new RequestTrace(requestId, startTime, startNanos);
        CURRENT.set(trace);
        return trace;
    }

    public static RequestTrace current() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static boolean isSuppressed() {
        return SUPPRESSED.get();
    }

    public static void runSuppressed(Runnable action) {
        boolean previous = SUPPRESSED.get();
        SUPPRESSED.set(true);
        try {
            action.run();
        } finally {
            SUPPRESSED.set(previous);
        }
    }

    public static String newRequestId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static final class RequestTrace {

        private final String requestId;

        private final LocalDateTime startTime;

        private final long startNanos;

        private int sqlCount;

        private int slowSqlCount;

        private RequestTrace(String requestId, LocalDateTime startTime, long startNanos) {
            this.requestId = requestId;
            this.startTime = startTime;
            this.startNanos = startNanos;
        }

        public String requestId() {
            return requestId;
        }

        public LocalDateTime startTime() {
            return startTime;
        }

        public long startNanos() {
            return startNanos;
        }

        public int sqlCount() {
            return sqlCount;
        }

        public int slowSqlCount() {
            return slowSqlCount;
        }

        public void incrementSqlCount() {
            sqlCount++;
        }

        public void incrementSlowSqlCount() {
            slowSqlCount++;
        }
    }
}
