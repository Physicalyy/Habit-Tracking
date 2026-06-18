package com.physicalyy.habittracking.modules.habit.controller;

import jakarta.validation.constraints.NotNull;

public record AddChildHabitRequest(
        @NotNull
        Long templateId
) {
}
