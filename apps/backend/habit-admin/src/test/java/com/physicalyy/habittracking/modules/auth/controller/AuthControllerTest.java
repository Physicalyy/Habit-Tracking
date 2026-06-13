package com.physicalyy.habittracking.modules.auth.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
                .andExpect(jsonPath("$.data.user.openid").value("login-openid-001"))
                .andExpect(jsonPath("$.data.user.nickname").value("登录家长"));
    }
}
