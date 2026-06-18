package com.physicalyy.habittracking.modules.checkin.vo;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckinHistoryItem(
        Long checkinId,
        Long childId,
        Long childHabitId,
        String habitName,
        String description,
        String iconKey,
        String imageUrl,
        LocalDate checkinDate,
        LocalDateTime checkedTime,
        Long checkedByMemberId,
        String note
) {
}
