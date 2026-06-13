package com.physicalyy.habittracking.modules.checkin.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.checkin.service.CheckinService;
import com.physicalyy.habittracking.modules.checkin.vo.TodayHabitSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId
    ) {
        return ApiResult.ok(checkinService.listTodayHabits(openid, nickname, childId));
    }

    @PostMapping("/api/children/{childId}/habits/{childHabitId}/checkins")
    public ApiResult<TodayHabitSummary> checkin(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long childId,
            @PathVariable Long childHabitId
    ) {
        return ApiResult.ok(checkinService.checkin(openid, nickname, childId, childHabitId));
    }
}
