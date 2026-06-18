package com.physicalyy.habittracking.modules.auth.controller;

import jakarta.validation.constraints.NotBlank;

public record WechatLoginRequest(
        @NotBlank
        String code
) {
}
