package com.physicalyy.habittracking.modules.auth.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.auth.service.AuthService;
import com.physicalyy.habittracking.modules.auth.vo.WechatLoginResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/wechat-login")
    public ApiResult<WechatLoginResponse> wechatLogin(
            @Valid @RequestBody WechatLoginRequest request
    ) {
        return ApiResult.ok(authService.wechatLogin(request));
    }
}
