package com.physicalyy.habittracking.v1;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class V1IntegrationSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void full_v1_core_flow_smoke() throws Exception {
        String ownerOpenid = uniqueOpenid("v1o");
        String memberOpenid = uniqueOpenid("v1m");

        mockMvc.perform(post("/api/auth/wechat-login")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "code": "owner-code"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.openid").value(ownerOpenid));

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.needOnboarding").value(true))
                .andExpect(jsonPath("$.data.currentUser.openid").value(ownerOpenid));

        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "V1 Smoke Family",
                                  "childNickname": "小烟测"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.family.admin").value(true))
                .andExpect(jsonPath("$.data.child.nickname").value("小烟测"))
                .andExpect(jsonPath("$.data.inviteCode.code").isString());

        Long familyId = familyId("V1 Smoke Family");
        Long childId = defaultChildId(familyId);
        String oldInviteCode = activeInviteCode(familyId);

        String refreshResponse = mockMvc.perform(post("/api/families/{familyId}/invite/refresh", familyId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("active"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String newInviteCode = refreshResponse.replaceAll("(?s).*\"code\":\"(\\d{6})\".*", "$1");
        assertThat(newInviteCode).hasSize(6).isNotEqualTo(oldInviteCode);

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", uniqueOpenid("v1old"))
                        .header("X-Test-Nickname", "旧码家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(oldInviteCode)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "成员家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(newInviteCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.family.admin").value(false))
                .andExpect(jsonPath("$.data.member.admin").value(false));

        mockMvc.perform(get("/api/families/{familyId}/members", familyId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[*].admin").value(hasItem(true)))
                .andExpect(jsonPath("$.data[*].admin").value(hasItem(false)));

        Long systemTemplateId = templateId("drink-water");
        mockMvc.perform(post("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateId": %d
                                }
                                """.formatted(systemTemplateId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("主动喝水"))
                .andExpect(jsonPath("$.data.permissionType").value("ALL_PARENTS"));
        Long systemChildHabitId = childHabitId(childId, systemTemplateId);

        mockMvc.perform(post("/api/habit-templates/custom")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "childId": %d,
                                  "name": "练习钢琴",
                                  "description": "每天十分钟",
                                  "category": "CUSTOM",
                                  "iconKey": "piano"
                                }
                                """.formatted(childId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.template.sourceType").value("CUSTOM"))
                .andExpect(jsonPath("$.data.childHabit.permissionType").value("ALL_PARENTS"));

        Long customChildHabitId = jdbcTemplate.queryForObject(
                "select id from habit_child_config where child_id = ? and name = ? and del_flag = '0'",
                Long.class,
                childId,
                "练习钢琴"
        );

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, systemChildHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "OWNER_ONLY"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissionType").value("OWNER_ONLY"));

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "成员家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[?(@.childHabitId == %d)].canCheckin".formatted(systemChildHabitId)).value(hasItem(false)))
                .andExpect(jsonPath("$.data[?(@.childHabitId == %d)].canCheckin".formatted(customChildHabitId)).value(hasItem(true)));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, systemChildHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "成员家长"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, systemChildHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checked").value(true));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, systemChildHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(patch("/api/children/{childId}/habits/{childHabitId}/status", childId, systemChildHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长")
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "disabled"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("disabled"));

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].childHabitId").value(not(hasItem(systemChildHabitId))));

        mockMvc.perform(get("/api/children/{childId}/checkins", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].childHabitId").value(systemChildHabitId))
                .andExpect(jsonPath("$.data[0].habitName").value("主动喝水"))
                .andExpect(jsonPath("$.data[0].iconKey").value("water_drop"));

        mockMvc.perform(get("/api/children/{childId}/checkins/summary", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "主家长"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCheckinCount").value(1))
                .andExpect(jsonPath("$.data.totalCheckinDays").value(1));
    }

    private String uniqueOpenid(String prefix) {
        return prefix + "-" + Long.toString(System.nanoTime(), 36);
    }

    private Long familyId(String familyName) {
        return jdbcTemplate.queryForObject(
                "select id from family_group where name = ? and del_flag = '0'",
                Long.class,
                familyName
        );
    }

    private Long defaultChildId(Long familyId) {
        return jdbcTemplate.queryForObject(
                "select id from child_profile where family_id = ? and status = 'active' and del_flag = '0'",
                Long.class,
                familyId
        );
    }

    private String activeInviteCode(Long familyId) {
        return jdbcTemplate.queryForObject(
                "select code from family_invite_code where family_id = ? and status = 'active' and del_flag = '0'",
                String.class,
                familyId
        );
    }

    private Long templateId(String slug) {
        return jdbcTemplate.queryForObject(
                "select id from habit_template where slug = ? and del_flag = '0'",
                Long.class,
                slug
        );
    }

    private Long childHabitId(Long childId, Long templateId) {
        return jdbcTemplate.queryForObject(
                "select id from habit_child_config where child_id = ? and template_id = ? and del_flag = '0'",
                Long.class,
                childId,
                templateId
        );
    }
}
