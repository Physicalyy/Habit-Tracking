package com.physicalyy.habittracking.modules.auth.service;

public record CurrentUserIdentity(
        Long userId,
        String openid,
        String nickname
) {
}
