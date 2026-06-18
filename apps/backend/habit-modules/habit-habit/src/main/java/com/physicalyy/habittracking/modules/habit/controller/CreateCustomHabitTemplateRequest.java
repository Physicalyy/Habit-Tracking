package com.physicalyy.habittracking.modules.habit.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCustomHabitTemplateRequest(
        @NotNull
        Long childId,

        @NotBlank
        @Size(max = 64)
        String name,

        @Size(max = 512)
        String description,

        @Size(max = 64)
        String category,

        @Size(max = 128)
        String iconKey,

        @Size(max = 512)
        String imageUrl
) {
}
