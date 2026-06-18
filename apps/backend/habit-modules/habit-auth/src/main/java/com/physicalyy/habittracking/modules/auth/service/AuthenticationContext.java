package com.physicalyy.habittracking.modules.auth.service;

import com.physicalyy.habittracking.common.exception.UnauthorizedException;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.Optional;

@Component
public class AuthenticationContext {

    public static final String CURRENT_USER_ATTRIBUTE = AuthenticationContext.class.getName() + ".CURRENT_USER";

    public CurrentUserIdentity requireCurrentUserIdentity() {
        return currentUserIdentity()
                .orElseThrow(() -> new UnauthorizedException("Authentication is required"));
    }

    public Optional<CurrentUserIdentity> currentUserIdentity() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return Optional.empty();
        }
        Object currentUser = attributes.getAttribute(CURRENT_USER_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (currentUser instanceof CurrentUserIdentity identity) {
            return Optional.of(identity);
        }
        return Optional.empty();
    }
}
