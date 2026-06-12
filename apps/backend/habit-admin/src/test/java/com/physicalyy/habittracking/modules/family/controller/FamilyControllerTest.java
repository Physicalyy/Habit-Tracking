package com.physicalyy.habittracking.modules.family.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class FamilyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String openid;

    @BeforeEach
    void setUp() {
        openid = "family-openid-" + System.nanoTime();
    }

    @Test
    void create_family_creates_user_member_child_and_invite_code() throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "小宝的家庭",
                                  "childNickname": "小宝"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.family.name").value("小宝的家庭"))
                .andExpect(jsonPath("$.data.family.admin").value(true))
                .andExpect(jsonPath("$.data.child.nickname").value("小宝"))
                .andExpect(jsonPath("$.data.inviteCode.code").isString())
                .andExpect(jsonPath("$.data.inviteCode.status").value("active"));

        assertThat(countBy("auth_user_account", "openid", openid)).isEqualTo(1);
        Long familyId = jdbcTemplate.queryForObject(
                "select id from family_group where name = ?",
                Long.class,
                "小宝的家庭"
        );
        Long adminMemberId = jdbcTemplate.queryForObject(
                "select admin_member_id from family_group where id = ?",
                Long.class,
                familyId
        );

        assertThat(adminMemberId).isNotNull();
        assertThat(countBy("family_member", "family_id", familyId)).isEqualTo(1);
        assertThat(countBy("child_profile", "family_id", familyId)).isEqualTo(1);
        assertThat(countBy("family_invite_code", "family_id", familyId)).isEqualTo(1);
        assertThat(activeInviteCode(familyId)).hasSize(6);
    }

    @Test
    void create_family_with_blank_name_returns_api_error() throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "",
                                  "childNickname": "小宝"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void repeated_openid_reuses_user_account_and_updates_profile() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "旧昵称"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "新昵称"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentUser.nickname").value("新昵称"));

        assertThat(countBy("auth_user_account", "openid", openid)).isEqualTo(1);
    }

    private Long countBy(String table, String column, Object value) {
        return jdbcTemplate.queryForObject(
                "select count(*) from " + table + " where " + column + " = ? and del_flag = '0'",
                Long.class,
                value
        );
    }

    private String activeInviteCode(Long familyId) {
        return jdbcTemplate.queryForObject(
                "select code from family_invite_code where family_id = ? and status = 'active'",
                String.class,
                familyId
        );
    }
}
