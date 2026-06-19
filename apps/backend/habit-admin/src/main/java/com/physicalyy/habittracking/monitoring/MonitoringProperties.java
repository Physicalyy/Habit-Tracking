package com.physicalyy.habittracking.monitoring;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "habit.monitoring")
public class MonitoringProperties {

    private boolean enabled = true;

    private long slowThresholdMs = 2500;

    private int maxQueryStringLength = 1024;

    private int maxSqlTextLength = 4000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public long getSlowThresholdMs() {
        return slowThresholdMs;
    }

    public void setSlowThresholdMs(long slowThresholdMs) {
        this.slowThresholdMs = slowThresholdMs;
    }

    public int getMaxQueryStringLength() {
        return maxQueryStringLength;
    }

    public void setMaxQueryStringLength(int maxQueryStringLength) {
        this.maxQueryStringLength = maxQueryStringLength;
    }

    public int getMaxSqlTextLength() {
        return maxSqlTextLength;
    }

    public void setMaxSqlTextLength(int maxSqlTextLength) {
        this.maxSqlTextLength = maxSqlTextLength;
    }
}
