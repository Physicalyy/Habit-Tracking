package com.physicalyy.habittracking.modules.habit.vo;

import com.physicalyy.habittracking.modules.habit.entity.HabitTemplate;

public record CustomHabitTemplateSummary(
        Long id,
        String slug,
        String name,
        String category,
        String description,
        String iconKey,
        String imageUrl,
        String sourceType,
        Long familyId,
        Long createdByMemberId,
        String status
) {

    public static CustomHabitTemplateSummary from(HabitTemplate template) {
        return new CustomHabitTemplateSummary(
                template.getId(),
                template.getSlug(),
                template.getName(),
                template.getCategory(),
                template.getDescription(),
                template.getIconKey(),
                template.getImageUrl(),
                template.getSourceType(),
                template.getFamilyId(),
                template.getCreatedByMemberId(),
                template.getStatus()
        );
    }
}
