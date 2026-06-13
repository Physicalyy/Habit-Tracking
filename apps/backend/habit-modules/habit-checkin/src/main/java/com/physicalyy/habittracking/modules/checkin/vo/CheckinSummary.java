package com.physicalyy.habittracking.modules.checkin.vo;

public record CheckinSummary(
        Long childId,
        long totalCheckinCount,
        long totalCheckinDays
) {
}
