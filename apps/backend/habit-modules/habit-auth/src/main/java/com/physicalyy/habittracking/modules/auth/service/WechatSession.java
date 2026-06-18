package com.physicalyy.habittracking.modules.auth.service;

public record WechatSession(
        String openid,
        String unionid,
        String sessionKey
) {
}
