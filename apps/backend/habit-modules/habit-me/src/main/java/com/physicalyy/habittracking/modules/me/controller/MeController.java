package com.physicalyy.habittracking.modules.me.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.me.service.MeBootstrapService;
import com.physicalyy.habittracking.modules.me.service.MeProfileService;
import com.physicalyy.habittracking.modules.me.vo.BootstrapResponse;
import com.physicalyy.habittracking.modules.me.vo.CurrentUserSummary;
import com.physicalyy.habittracking.modules.me.vo.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final MeBootstrapService meBootstrapService;
    private final MeProfileService meProfileService;

    public MeController(MeBootstrapService meBootstrapService, MeProfileService meProfileService) {
        this.meBootstrapService = meBootstrapService;
        this.meProfileService = meProfileService;
    }

    @GetMapping("/bootstrap")
    public ApiResult<BootstrapResponse> bootstrap() {
        return ApiResult.ok(meBootstrapService.bootstrap());
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResult<AvatarUploadResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        return ApiResult.ok(new AvatarUploadResponse(meProfileService.uploadAvatar(file)));
    }

    @PatchMapping("/profile")
    public ApiResult<CurrentUserSummary> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResult.ok(meProfileService.updateProfile(request));
    }

    public record AvatarUploadResponse(String avatarUrl) {
    }
}
