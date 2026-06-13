package com.physicalyy.habittracking.modules.habit.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.habit.service.ChildHabitService;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitPermissionSummary;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitSummary;
import com.physicalyy.habittracking.modules.habit.vo.CreateCustomHabitResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId
    ) {
        return ApiResult.ok(childHabitService.listChildHabits(openid, nickname, childId));
    }

    @PostMapping("/api/children/{childId}/habits")
    public ApiResult<ChildHabitSummary> addSystemTemplate(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId,
            @Valid @RequestBody AddChildHabitRequest request
    ) {
        return ApiResult.ok(childHabitService.addSystemTemplate(openid, nickname, childId, request));
    }

    @PatchMapping("/api/children/{childId}/habits/{childHabitId}")
    public ApiResult<ChildHabitSummary> updateChildHabit(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitRequest request
    ) {
        return ApiResult.ok(childHabitService.updateChildHabit(openid, nickname, childId, childHabitId, request));
    }

    @PutMapping("/api/children/{childId}/habits/{childHabitId}/permissions")
    public ApiResult<ChildHabitPermissionSummary> updatePermissions(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitPermissionRequest request
    ) {
        return ApiResult.ok(childHabitService.updatePermissions(openid, nickname, childId, childHabitId, request));
    }

    @PatchMapping("/api/children/{childId}/habits/{childHabitId}/status")
    public ApiResult<ChildHabitSummary> updateStatus(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId,
            @PathVariable Long childHabitId,
            @Valid @RequestBody UpdateChildHabitStatusRequest request
    ) {
        return ApiResult.ok(childHabitService.updateStatus(openid, nickname, childId, childHabitId, request));
    }

    @PostMapping("/api/habit-templates/custom")
    public ApiResult<CreateCustomHabitResponse> createCustomHabit(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @Valid @RequestBody CreateCustomHabitTemplateRequest request
    ) {
        return ApiResult.ok(childHabitService.createCustomHabit(openid, nickname, request));
    }
}
