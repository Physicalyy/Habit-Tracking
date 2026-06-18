package com.physicalyy.habittracking.modules.auth.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class WechatLoginClient {

    private final WechatMiniProgramProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public WechatLoginClient(WechatMiniProgramProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public WechatSession codeToSession(String code) {
        if (!StringUtils.hasText(properties.appid()) || !StringUtils.hasText(properties.secret())) {
            throw new BusinessException("BAD_REQUEST", "WeChat login is not configured");
        }

        URI uri = UriComponentsBuilder.fromUriString(properties.codeToSessionUrl())
                .queryParam("appid", properties.appid())
                .queryParam("secret", properties.secret())
                .queryParam("js_code", code)
                .queryParam("grant_type", "authorization_code")
                .build()
                .toUri();
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessException("BAD_REQUEST", "WeChat login request failed");
            }
            WechatCodeToSessionResponse body = objectMapper.readValue(response.body(), WechatCodeToSessionResponse.class);
            if (body.errcode() != null && body.errcode() != 0) {
                throw new BusinessException("BAD_REQUEST", "WeChat login failed");
            }
            if (!StringUtils.hasText(body.openid())) {
                throw new BusinessException("BAD_REQUEST", "WeChat login did not return openid");
            }
            return new WechatSession(body.openid(), body.unionid(), body.sessionKey());
        } catch (IOException exception) {
            throw new BusinessException("BAD_REQUEST", "WeChat login request failed");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new BusinessException("BAD_REQUEST", "WeChat login request failed");
        }
    }

    private record WechatCodeToSessionResponse(
            String openid,
            String unionid,
            @JsonProperty("session_key")
            String sessionKey,
            Integer errcode,
            String errmsg
    ) {
    }
}
