package com.physicalyy.habittracking.modules.habit.vo;

import com.physicalyy.habittracking.modules.habit.entity.HabitTemplate;

public record HabitTemplateSummary(
        Long id,
        String slug,
        String name,
        String category,
        String description,
        Integer ageMin,
        Integer ageMax,
        String iconKey,
        String imageUrl,
        String sourceType,
        String status
) {

    public static HabitTemplateSummary from(HabitTemplate template) {
        return new HabitTemplateSummary(
                template.getId(),
                template.getSlug(),
                template.getName(),
                template.getCategory(),
                template.getDescription(),
                template.getAgeMin(),
                template.getAgeMax(),
                template.getIconKey(),
                template.getImageUrl(),
                template.getSourceType(),
                template.getStatus()
        );
    }
}
