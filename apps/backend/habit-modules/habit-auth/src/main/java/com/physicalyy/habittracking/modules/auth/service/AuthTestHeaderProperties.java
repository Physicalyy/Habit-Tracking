package com.physicalyy.habittracking.modules.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AuthTestHeaderProperties {

    private final boolean enabled;

    public AuthTestHeaderProperties(
            @Value("${auth.test-headers.enabled:false}") boolean enabled
    ) {
        this.enabled = enabled;
    }

    public boolean enabled() {
        return enabled;
    }
}
