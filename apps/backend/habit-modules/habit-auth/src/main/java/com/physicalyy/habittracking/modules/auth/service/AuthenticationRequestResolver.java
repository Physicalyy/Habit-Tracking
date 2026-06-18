package com.physicalyy.habittracking.modules.auth.service;

import com.physicalyy.habittracking.common.exception.UnauthorizedException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

@Component
public class AuthenticationRequestResolver {

    private final AuthTokenService authTokenService;
    private final CurrentUserService currentUserService;
    private final AuthTestHeaderProperties authTestHeaderProperties;

    public AuthenticationRequestResolver(
            AuthTokenService authTokenService,
            CurrentUserService currentUserService,
            AuthTestHeaderProperties authTestHeaderProperties
    ) {
        this.authTokenService = authTokenService;
        this.currentUserService = currentUserService;
        this.authTestHeaderProperties = authTestHeaderProperties;
    }

    public void resolve(HttpServletRequest request) {
        CurrentUserIdentity identity = resolveIdentity(request);
        if (identity == null) {
            return;
        }
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            attributes.setAttribute(AuthenticationContext.CURRENT_USER_ATTRIBUTE, identity, RequestAttributes.SCOPE_REQUEST);
        }
    }

    private CurrentUserIdentity resolveIdentity(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (StringUtils.hasText(authorization)) {
            if (!authorization.startsWith("Bearer ")) {
                throw new UnauthorizedException("Authentication token is invalid");
            }
            AuthTokenPayload payload = authTokenService.verify(authorization.substring("Bearer ".length()).trim());
            UserAccount user = currentUserService.requireUserByTokenPayload(payload);
            return new CurrentUserIdentity(user.getId(), user.getOpenid(), user.getNickname());
        }

        String testOpenid = request.getHeader("X-Test-Openid");
        if (authTestHeaderProperties.enabled() && StringUtils.hasText(testOpenid)) {
            UserAccount user = currentUserService.findOrCreateByOpenid(testOpenid, request.getHeader("X-Test-Nickname"), null);
            return new CurrentUserIdentity(user.getId(), user.getOpenid(), user.getNickname());
        }

        return null;
    }
}
