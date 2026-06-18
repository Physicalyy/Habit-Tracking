package com.physicalyy.habittracking.modules.habit.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.habit.service.ChildHabitService;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitPermissionSummary;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitSummary;
import com.physicalyy.habittracking.modules.habit.vo.CreateCustomHabitResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ChildHabitController {

    private final ChildHabitService childHabitService;

    public ChildHabitController(ChildHabitService childHabitService) {
        this.childHabitService = childHabitService;
    }

    @GetMapping("/api/children/{childId}/habits")
    public ApiResult<List<ChildHabitSummary>> listChildHabits(
            @PathVariable Long childId
    ) {
        return ApiResult.ok(childHabitService.listChildHabits(childId));
    }

    @PostMapping("/api/children/{childId}/habits")
    public ApiResult<ChildHabitSummary> addSystemTemplate(
            @PathVariable Long childId,
            @Valid @RequestBody AddChildHabitRequest request
    ) {
        return ApiResult.ok(childHabitService.addSystemTemplate(childId, request));
    }

    @PatchMapping("/api/children/{childId}/habits/{childHabitId}")
    public ApiResult<ChildHabitSummary> updateChildHabit(
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitRequest request
    ) {
        return ApiResult.ok(childHabitService.updateChildHabit(childId, childHabitId, request));
    }

    @PutMapping("/api/children/{childId}/habits/{childHabitId}/permissions")
    public ApiResult<ChildHabitPermissionSummary> updatePermissions(
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitPermissionRequest request
    ) {
        return ApiResult.ok(childHabitService.updatePermissions(childId, childHabitId, request));
    }

    @PatchMapping("/api/children/{childId}/habits/{childHabitId}/status")
    public ApiResult<ChildHabitSummary> updateStatus(
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitStatusRequest request
    ) {
        return ApiResult.ok(childHabitService.updateStatus(childId, childHabitId, request));
    }

    @DeleteMapping("/api/children/{childId}/habits/{childHabitId}")
    public ApiResult<Void> deleteChildHabit(
            @PathVariable Long childId,
            @PathVariable Long childHabitId
    ) {
        childHabitService.deleteChildHabit(childId, childHabitId);
        return ApiResult.ok(null);
    }

    @PostMapping("/api/habit-templates/custom")
    public ApiResult<CreateCustomHabitResponse> createCustomHabit(
            @Valid @RequestBody CreateCustomHabitTemplateRequest request
    ) {
        return ApiResult.ok(childHabitService.createCustomHabit(request));
    }
}
