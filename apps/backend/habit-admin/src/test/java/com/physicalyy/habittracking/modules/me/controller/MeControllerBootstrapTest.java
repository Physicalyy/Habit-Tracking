package com.physicalyy.habittracking.modules.me.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class MeControllerBootstrapTest {

    @Autowired
    private MockMvc mockMvc;

    private String openid;

    @BeforeEach
    void setUp() {
        openid = "openid-" + System.nanoTime();
    }

    @Test
    void bootstrap_without_openid_returns_bad_request() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void bootstrap_with_new_openid_returns_onboarding_required() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.needOnboarding").value(true))
                .andExpect(jsonPath("$.data.currentUser.openid").value(openid))
                .andExpect(jsonPath("$.data.currentUser.nickname").value("妈妈"))
                .andExpect(jsonPath("$.data.families").isArray())
                .andExpect(jsonPath("$.data.defaultFamily").doesNotExist())
                .andExpect(jsonPath("$.data.defaultChild").doesNotExist());
    }

    @Test
    void bootstrap_after_creating_family_returns_default_family_and_child() throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "爸爸")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "小宝的家庭",
                                  "childNickname": "小宝"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "爸爸"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.needOnboarding").value(false))
                .andExpect(jsonPath("$.data.currentUser.id").isString())
                .andExpect(jsonPath("$.data.defaultFamily.id").isString())
                .andExpect(jsonPath("$.data.defaultFamily.name").value("小宝的家庭"))
                .andExpect(jsonPath("$.data.defaultFamily.admin").value(true))
                .andExpect(jsonPath("$.data.defaultChild.id").isString())
                .andExpect(jsonPath("$.data.defaultChild.familyId").isString())
                .andExpect(jsonPath("$.data.defaultChild.nickname").value("小宝"))
                .andExpect(jsonPath("$.data.families[0].name").value("小宝的家庭"))
                .andExpect(jsonPath("$.data.families[0].id").isString())
                .andExpect(jsonPath("$.data.families[0].admin").value(true));
    }
}
