package com.physicalyy.habittracking.modules.checkin.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.checkin.service.CheckinService;
import com.physicalyy.habittracking.modules.checkin.vo.CheckinHistoryItem;
import com.physicalyy.habittracking.modules.checkin.vo.CheckinSummary;
import com.physicalyy.habittracking.modules.checkin.vo.TodayHabitSummary;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CheckinController {

    private final CheckinService checkinService;

    public CheckinController(CheckinService checkinService) {
        this.checkinService = checkinService;
    }

    @GetMapping("/api/children/{childId}/today")
    public ApiResult<List<TodayHabitSummary>> listTodayHabits(
            @PathVariable Long childId
    ) {
        return ApiResult.ok(checkinService.listTodayHabits(childId));
    }

    @PostMapping("/api/children/{childId}/habits/{childHabitId}/checkins")
    public ApiResult<TodayHabitSummary> checkin(
            @PathVariable Long childId,
            @PathVariable Long childHabitId
    ) {
        return ApiResult.ok(checkinService.checkin(childId, childHabitId));
    }

    @DeleteMapping("/api/children/{childId}/habits/{childHabitId}/checkins/today")
    public ApiResult<TodayHabitSummary> undoTodayCheckin(
            @PathVariable Long childId,
            @PathVariable Long childHabitId
    ) {
        return ApiResult.ok(checkinService.undoTodayCheckin(childId, childHabitId));
    }

    @GetMapping("/api/children/{childId}/checkins")
    public ApiResult<List<CheckinHistoryItem>> listHistory(
            @PathVariable Long childId
    ) {
        return ApiResult.ok(checkinService.listHistory(childId));
    }

    @GetMapping("/api/children/{childId}/checkins/summary")
    public ApiResult<CheckinSummary> getSummary(
            @PathVariable Long childId
    ) {
        return ApiResult.ok(checkinService.getSummary(childId));
    }
}
