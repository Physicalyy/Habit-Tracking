package com.physicalyy.habittracking.modules.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Base64;

@Component
public class AuthTokenProperties {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final String secret;
    private final long ttlSeconds;

    public AuthTokenProperties(
            @Value("${AUTH_TOKEN_SECRET:${auth.token.secret:}}") String secret,
            @Value("${AUTH_TOKEN_TTL_SECONDS:${auth.token.ttl-seconds:604800}}") long ttlSeconds
    ) {
        this.secret = StringUtils.hasText(secret) ? secret : generateEphemeralSecret();
        this.ttlSeconds = ttlSeconds;
    }

    public String secret() {
        return secret;
    }

    public long ttlSeconds() {
        return ttlSeconds;
    }

    private String generateEphemeralSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
