package com.physicalyy.habittracking.modules.habit.vo;

import java.util.List;

public record ChildHabitPermissionSummary(
        Long childHabitId,
        Long childId,
        String permissionType,
        List<Long> allowedMemberIds
) {
}
