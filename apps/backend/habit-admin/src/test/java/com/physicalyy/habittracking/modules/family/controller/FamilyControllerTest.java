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
    void join_family_with_active_invite_adds_member_and_returns_default_child() throws Exception {
        String ownerOpenid = "fam-owner-" + System.nanoTime();
        String memberOpenid = "fam-member-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "星星之家", "星星");
        String inviteCode = activeInviteCode(familyId);

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "外婆")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(inviteCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.family.id").value(familyId))
                .andExpect(jsonPath("$.data.family.name").value("星星之家"))
                .andExpect(jsonPath("$.data.family.admin").value(false))
                .andExpect(jsonPath("$.data.child.nickname").value("星星"))
                .andExpect(jsonPath("$.data.member.displayName").value("外婆"))
                .andExpect(jsonPath("$.data.member.admin").value(false));

        assertThat(countBy("family_member", "family_id", familyId)).isEqualTo(2);

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "外婆"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.needOnboarding").value(false))
                .andExpect(jsonPath("$.data.defaultFamily.id").value(familyId))
                .andExpect(jsonPath("$.data.defaultFamily.admin").value(false))
                .andExpect(jsonPath("$.data.defaultChild.nickname").value("星星"));
    }

    @Test
    void join_family_with_invalid_invite_returns_api_error() throws Exception {
        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", "bad-member-" + System.nanoTime())
                        .header("X-Test-Nickname", "外婆")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "abc"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", "missing-member-" + System.nanoTime())
                        .header("X-Test-Nickname", "外婆")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "999999"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void refresh_invite_invalidates_old_code_and_new_code_can_join() throws Exception {
        String ownerOpenid = "ref-owner-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "月亮之家", "月亮");
        String oldCode = activeInviteCode(familyId);

        mockMvc.perform(get("/api/families/{familyId}/invite", familyId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(oldCode))
                .andExpect(jsonPath("$.data.status").value("active"));

        String refreshResponse = mockMvc.perform(post("/api/families/{familyId}/invite/refresh", familyId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("active"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String newCode = refreshResponse.replaceAll("(?s).*\"code\":\"(\\d{6})\".*", "$1");

        assertThat(newCode).hasSize(6).isNotEqualTo(oldCode);
        assertThat(activeInviteCode(familyId)).isEqualTo(newCode);

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", "old-member-" + System.nanoTime())
                        .header("X-Test-Nickname", "外公")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(oldCode)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", "new-member-" + System.nanoTime())
                        .header("X-Test-Nickname", "外婆")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(newCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.family.id").value(familyId))
                .andExpect(jsonPath("$.data.family.admin").value(false));
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

    private Long createFamilyAndReturnId(String ownerOpenid, String familyName, String childNickname) throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "妈妈")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "%s",
                                  "childNickname": "%s"
                                }
                                """.formatted(familyName, childNickname)))
                .andExpect(status().isOk());

        return jdbcTemplate.queryForObject(
                "select id from family_group where name = ? and del_flag = '0'",
                Long.class,
                familyName
        );
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
