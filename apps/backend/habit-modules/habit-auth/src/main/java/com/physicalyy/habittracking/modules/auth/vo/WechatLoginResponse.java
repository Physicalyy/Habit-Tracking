package com.physicalyy.habittracking.modules.auth.vo;

public record WechatLoginResponse(
        String token,
        AuthUserSummary user
) {
}
