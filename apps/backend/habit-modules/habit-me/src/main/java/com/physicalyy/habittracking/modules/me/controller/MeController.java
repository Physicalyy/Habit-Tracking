package com.physicalyy.habittracking.modules.me.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.me.service.MeBootstrapService;
import com.physicalyy.habittracking.modules.me.vo.BootstrapResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeBootstrapService meBootstrapService;

    public MeController(MeBootstrapService meBootstrapService) {
        this.meBootstrapService = meBootstrapService;
    }

    @GetMapping("/bootstrap")
    public ApiResult<BootstrapResponse> bootstrap() {
        return ApiResult.ok(meBootstrapService.bootstrap());
    }
}
