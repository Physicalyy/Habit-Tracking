package com.physicalyy.habittracking.modules.checkin.vo;

import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerChange;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TodayHabitSummary(
        Long childHabitId,
        Long childId,
        String name,
        String description,
        String iconKey,
        String imageUrl,
        String permissionType,
        boolean canCheckin,
        boolean checked,
        Long checkinId,
        Long checkedByMemberId,
        LocalDate checkinDate,
        LocalDateTime checkedTime,
        GrowthPartnerChange growthPartnerChange
) {
}
