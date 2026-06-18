package com.physicalyy.habittracking.modules.auth.vo;

public record AuthUserSummary(
        Long id,
        String openid,
        String nickname,
        String avatarUrl,
        boolean profileCompleted
) {
}
