package com.physicalyy.habittracking.modules.auth.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void wechat_login_uses_test_identity_when_headers_are_present() throws Exception {
        mockMvc.perform(post("/api/auth/wechat-login")
                        .header("X-Test-Openid", "login-openid-001")
                        .header("X-Test-Nickname", "登录家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "code": "wx-login-code"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.token").value(org.hamcrest.Matchers.not("test-token-1001")))
                .andExpect(jsonPath("$.data.user.openid").value("login-openid-001"))
                .andExpect(jsonPath("$.data.user.nickname").value("登录家长"))
                .andExpect(jsonPath("$.data.user.avatarUrl").doesNotExist())
                .andExpect(jsonPath("$.data.user.profileCompleted").value(true));
    }

    @Test
    void bearer_token_authenticates_business_requests() throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/wechat-login")
                        .header("X-Test-Openid", "token-openid-001")
                        .header("X-Test-Nickname", "Token Parent")
                        .contentType("application/json")
                        .content("""
                                {
                                  "code": "wx-login-code"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = loginResponse.replaceAll("(?s).*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.currentUser.openid").value("token-openid-001"))
                .andExpect(jsonPath("$.data.currentUser.nickname").value("Token Parent"))
                .andExpect(jsonPath("$.data.currentUser.profileCompleted").value(true));
    }

    @Test
    void invalid_bearer_token_returns_unauthorized() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }
}
