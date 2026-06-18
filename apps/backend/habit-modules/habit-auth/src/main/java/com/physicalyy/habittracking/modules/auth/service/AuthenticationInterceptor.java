package com.physicalyy.habittracking.modules.auth.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthenticationInterceptor implements HandlerInterceptor {

    private final AuthenticationRequestResolver authenticationRequestResolver;

    public AuthenticationInterceptor(AuthenticationRequestResolver authenticationRequestResolver) {
        this.authenticationRequestResolver = authenticationRequestResolver;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        authenticationRequestResolver.resolve(request);
        return true;
    }
}
