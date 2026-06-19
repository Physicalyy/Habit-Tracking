package com.physicalyy.habittracking.modules.me.vo;

public record CurrentUserSummary(
        Long id,
        String openid,
        String nickname,
        String avatarUrl,
        boolean profileCompleted
) {
}
