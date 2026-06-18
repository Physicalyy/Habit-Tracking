package com.physicalyy.habittracking.modules.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WechatLoginClientTest {

    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void code_to_session_returns_openid_and_unionid() throws Exception {
        WechatLoginClient client = clientWithResponse("""
                {
                  "openid": "openid-001",
                  "unionid": "union-001",
                  "session_key": "session-secret"
                }
                """);

        WechatSession session = client.codeToSession("wx-code");

        assertThat(session.openid()).isEqualTo("openid-001");
        assertThat(session.unionid()).isEqualTo("union-001");
        assertThat(session.sessionKey()).isEqualTo("session-secret");
    }

    @Test
    void code_to_session_rejects_wechat_error_code() throws Exception {
        WechatLoginClient client = clientWithResponse("""
                {
                  "errcode": 40029,
                  "errmsg": "invalid code"
                }
                """);

        assertThatThrownBy(() -> client.codeToSession("bad-code"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("WeChat login failed");
    }

    @Test
    void code_to_session_rejects_empty_openid() throws Exception {
        WechatLoginClient client = clientWithResponse("""
                {
                  "session_key": "session-secret"
                }
                """);

        assertThatThrownBy(() -> client.codeToSession("wx-code"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("WeChat login did not return openid");
    }

    @Test
    void code_to_session_requires_wechat_configuration() {
        WechatLoginClient client = new WechatLoginClient(
                new WechatMiniProgramProperties("", "", "http://127.0.0.1/not-used"),
                new ObjectMapper()
        );

        assertThatThrownBy(() -> client.codeToSession("wx-code"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("WeChat login is not configured");
    }

    private WechatLoginClient clientWithResponse(String responseBody) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/sns/jscode2session", exchange -> {
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        String url = "http://127.0.0.1:" + server.getAddress().getPort() + "/sns/jscode2session";
        return new WechatLoginClient(
                new WechatMiniProgramProperties("appid", "app-secret", url),
                new ObjectMapper()
        );
    }
}
