package com.physicalyy.habittracking.monitoring;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

@Component
public class MonitoringTextSanitizer {

    public String sanitizeQuery(String queryString, int maxLength) {
        if (!StringUtils.hasText(queryString)) {
            return null;
        }
        StringBuilder sanitized = new StringBuilder();
        String[] pairs = queryString.split("&");
        for (String pair : pairs) {
            if (!sanitized.isEmpty()) {
                sanitized.append('&');
            }
            int separatorIndex = pair.indexOf('=');
            String rawName = separatorIndex >= 0 ? pair.substring(0, separatorIndex) : pair;
            String rawValue = separatorIndex >= 0 ? pair.substring(separatorIndex + 1) : "";
            String decodedName = decode(rawName);
            sanitized.append(rawName);
            if (separatorIndex >= 0) {
                sanitized.append('=');
                sanitized.append(isSensitiveKey(decodedName) ? "<redacted>" : rawValue);
            } else if (isSensitiveKey(decodedName)) {
                sanitized.append("=<redacted>");
            } else if (StringUtils.hasText(rawValue)) {
                sanitized.append('=').append(rawValue);
            }
        }
        return truncate(sanitized.toString(), maxLength);
    }

    public String truncate(String value, int maxLength) {
        if (value == null || maxLength <= 0 || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    public String normalizeSql(String sql, int maxLength) {
        if (sql == null) {
            return "";
        }
        return truncate(sql.replaceAll("\\s+", " ").trim(), maxLength);
    }

    public String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte item : hash) {
                hex.append(String.format("%02x", item));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private boolean isSensitiveKey(String key) {
        if (key == null) {
            return false;
        }
        String normalized = key.toLowerCase(Locale.ROOT);
        return normalized.contains("token")
                || normalized.contains("code")
                || normalized.contains("secret")
                || normalized.contains("password");
    }

    private String decode(String value) {
        try {
            return UriUtils.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }
}
