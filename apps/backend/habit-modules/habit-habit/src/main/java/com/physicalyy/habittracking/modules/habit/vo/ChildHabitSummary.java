package com.physicalyy.habittracking.modules.habit.vo;

import com.physicalyy.habittracking.modules.habit.entity.HabitChildConfig;

public record ChildHabitSummary(
        Long id,
        Long familyId,
        Long childId,
        Long templateId,
        String name,
        String description,
        String iconKey,
        String imageUrl,
        String permissionType,
        Long createdByMemberId,
        String status,
        Integer sortOrder
) {

    public static ChildHabitSummary from(HabitChildConfig childHabit) {
        return new ChildHabitSummary(
                childHabit.getId(),
                childHabit.getFamilyId(),
                childHabit.getChildId(),
                childHabit.getTemplateId(),
                childHabit.getName(),
                childHabit.getDescription(),
                childHabit.getIconKey(),
                childHabit.getImageUrl(),
                childHabit.getPermissionType(),
                childHabit.getCreatedByMemberId(),
                childHabit.getStatus(),
                childHabit.getSortOrder()
        );
    }
}
