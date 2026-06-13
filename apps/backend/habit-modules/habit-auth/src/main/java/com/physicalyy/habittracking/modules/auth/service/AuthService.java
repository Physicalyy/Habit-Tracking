package com.physicalyy.habittracking.modules.auth.service;

import com.physicalyy.habittracking.modules.auth.controller.WechatLoginRequest;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.vo.AuthUserSummary;
import com.physicalyy.habittracking.modules.auth.vo.WechatLoginResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final CurrentUserService currentUserService;

    public AuthService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public WechatLoginResponse wechatLogin(String openid, String nickname, WechatLoginRequest request) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        return new WechatLoginResponse(
                "test-token-" + user.getId(),
                new AuthUserSummary(user.getId(), user.getOpenid(), user.getNickname())
        );
    }
}
