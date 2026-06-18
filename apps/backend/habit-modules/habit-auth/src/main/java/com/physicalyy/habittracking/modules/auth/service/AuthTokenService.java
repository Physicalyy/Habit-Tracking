package com.physicalyy.habittracking.modules.auth.service;

import com.physicalyy.habittracking.common.exception.UnauthorizedException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

@Service
public class AuthTokenService {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final AuthTokenProperties properties;

    public AuthTokenService(AuthTokenProperties properties) {
        this.properties = properties;
    }

    public String issue(UserAccount user) {
        long expiresAt = Instant.now().getEpochSecond() + properties.ttlSeconds();
        String payload = user.getId() + "." + encodePart(user.getOpenid()) + "." + expiresAt;
        return payload + "." + sign(payload);
    }

    public AuthTokenPayload verify(String token) {
        if (!StringUtils.hasText(token)) {
            throw new UnauthorizedException("Authentication is required");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 4) {
            throw new UnauthorizedException("Authentication token is invalid");
        }

        String payload = parts[0] + "." + parts[1] + "." + parts[2];
        String expectedSignature = sign(payload);
        if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[3].getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Authentication token is invalid");
        }

        try {
            Long userId = Long.valueOf(parts[0]);
            String openid = decodePart(parts[1]);
            long expiresAt = Long.parseLong(parts[2]);
            if (expiresAt <= Instant.now().getEpochSecond()) {
                throw new UnauthorizedException("Authentication token is expired");
            }
            return new AuthTokenPayload(userId, openid, expiresAt);
        } catch (IllegalArgumentException exception) {
            throw new UnauthorizedException("Authentication token is invalid");
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return ENCODER.encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign authentication token", exception);
        }
    }

    private String encodePart(String value) {
        return ENCODER.encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decodePart(String value) {
        return new String(DECODER.decode(value), StandardCharsets.UTF_8);
    }
}
