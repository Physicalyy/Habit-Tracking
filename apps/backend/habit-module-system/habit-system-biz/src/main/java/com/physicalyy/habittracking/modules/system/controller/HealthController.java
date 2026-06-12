package com.physicalyy.habittracking.modules.system.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ApiResult<HealthStatusResponse> health() {
        return ApiResult.ok(new HealthStatusResponse("UP", "habit-tracking-backend"));
    }

    public record HealthStatusResponse(String status, String service) {
    }
}
