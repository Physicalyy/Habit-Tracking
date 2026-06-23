package com.physicalyy.habittracking.modules.growthpartner.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.growthpartner.service.GrowthPartnerService;
import com.physicalyy.habittracking.modules.growthpartner.vo.ChildGrowthPartnerState;
import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerTemplateSummary;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class GrowthPartnerController {

    private final GrowthPartnerService growthPartnerService;

    public GrowthPartnerController(GrowthPartnerService growthPartnerService) {
        this.growthPartnerService = growthPartnerService;
    }

    @GetMapping("/api/growth-partner-templates")
    public ApiResult<List<GrowthPartnerTemplateSummary>> listTemplates() {
        return ApiResult.ok(growthPartnerService.listTemplates());
    }

    @GetMapping("/api/children/{childId}/growth-partner")
    public ApiResult<ChildGrowthPartnerState> getCurrentPartner(@PathVariable Long childId) {
        return ApiResult.ok(growthPartnerService.getCurrentPartner(childId));
    }

    @PostMapping("/api/children/{childId}/growth-partner/adopt")
    public ApiResult<ChildGrowthPartnerState> adopt(
            @PathVariable Long childId,
            @Valid @RequestBody AdoptGrowthPartnerRequest request
    ) {
        return ApiResult.ok(growthPartnerService.adopt(childId, request));
    }
}
