package com.physicalyy.habittracking.modules.habit.controller;

import jakarta.validation.constraints.NotBlank;

public record UpdateChildHabitStatusRequest(
        @NotBlank
        String status
) {
}
