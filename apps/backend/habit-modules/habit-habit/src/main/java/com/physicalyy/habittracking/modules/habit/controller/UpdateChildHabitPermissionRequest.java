package com.physicalyy.habittracking.modules.habit.controller;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UpdateChildHabitPermissionRequest(
        @NotBlank
        String permissionType,

        List<Long> allowedMemberIds
) {
}
