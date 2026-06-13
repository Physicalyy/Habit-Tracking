package com.physicalyy.habittracking.modules.family.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.family.service.FamilyService;
import com.physicalyy.habittracking.modules.family.vo.CreateFamilyResponse;
import com.physicalyy.habittracking.modules.family.vo.InviteCodeSummary;
import com.physicalyy.habittracking.modules.family.vo.JoinFamilyResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @PostMapping
    public ApiResult<CreateFamilyResponse> createFamily(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @Valid @RequestBody CreateFamilyRequest request
    ) {
        return ApiResult.ok(familyService.createFamily(openid, nickname, request));
    }

    @PostMapping("/join")
    public ApiResult<JoinFamilyResponse> joinFamily(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @Valid @RequestBody JoinFamilyRequest request
    ) {
        return ApiResult.ok(familyService.joinFamily(openid, nickname, request));
    }

    @GetMapping("/{familyId}/invite")
    public ApiResult<InviteCodeSummary> getInviteCode(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long familyId
    ) {
        return ApiResult.ok(familyService.getActiveInviteCode(openid, nickname, familyId));
    }

    @PostMapping("/{familyId}/invite/refresh")
    public ApiResult<InviteCodeSummary> refreshInviteCode(
            @RequestHeader(value = "X-Test-Openid", required = false) String openid,
            @RequestHeader(value = "X-Test-Nickname", required = false) String nickname,
            @PathVariable Long familyId
    ) {
        return ApiResult.ok(familyService.refreshInviteCode(openid, nickname, familyId));
    }
}
