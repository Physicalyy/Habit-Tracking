package com.physicalyy.habittracking.modules.auth.service;

public record AuthTokenPayload(
        Long userId,
        String openid,
        long expiresAtEpochSecond
) {
}
