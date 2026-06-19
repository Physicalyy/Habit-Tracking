package com.physicalyy.habittracking.modules.auth.service;

import com.physicalyy.habittracking.modules.auth.controller.WechatLoginRequest;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.vo.AuthUserSummary;
import com.physicalyy.habittracking.modules.auth.vo.WechatLoginResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final CurrentUserService currentUserService;
    private final WechatLoginClient wechatLoginClient;
    private final AuthTokenService authTokenService;
    private final AuthenticationContext authenticationContext;

    public AuthService(
            CurrentUserService currentUserService,
            WechatLoginClient wechatLoginClient,
            AuthTokenService authTokenService,
            AuthenticationContext authenticationContext
    ) {
        this.currentUserService = currentUserService;
        this.wechatLoginClient = wechatLoginClient;
        this.authTokenService = authTokenService;
        this.authenticationContext = authenticationContext;
    }

    public WechatLoginResponse wechatLogin(WechatLoginRequest request) {
        CurrentUserIdentity testIdentity = authenticationContext.currentUserIdentity().orElse(null);
        UserAccount user;
        if (testIdentity != null) {
            user = currentUserService.requireCurrentUser();
        } else {
            WechatSession session = wechatLoginClient.codeToSession(request.code());
            user = currentUserService.findOrCreateByOpenid(session.openid(), null, session.unionid());
        }
        return new WechatLoginResponse(
                authTokenService.issue(user),
                new AuthUserSummary(
                        user.getId(),
                        user.getOpenid(),
                        user.getNickname(),
                        user.getAvatarUrl(),
                        user.isProfileCompleted()
                )
        );
    }
}
