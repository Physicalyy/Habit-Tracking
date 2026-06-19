package com.physicalyy.habittracking.modules.checkin.controller;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class CheckinControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void today_lists_active_habits_and_checkin_prevents_duplicate() throws Exception {
        String ownerOpenid = uniqueOpenid("to");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Today Family", "Little Today");
        Long childId = defaultChildId(familyId);
        Long activeHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));
        Long disabledHabitId = addTemplate(ownerOpenid, childId, templateId("brush-teeth"));
        updateStatus(ownerOpenid, childId, disabledHabitId, "disabled");

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].childHabitId").value(String.valueOf(activeHabitId)))
                .andExpect(jsonPath("$.data[0].checked").value(false))
                .andExpect(jsonPath("$.data[0].canCheckin").value(true))
                .andExpect(jsonPath("$.data[*].childHabitId").value(not(hasItem(String.valueOf(disabledHabitId)))));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, activeHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.childHabitId").value(String.valueOf(activeHabitId)))
                .andExpect(jsonPath("$.data.checked").value(true))
                .andExpect(jsonPath("$.data.canCheckin").value(true))
                .andExpect(jsonPath("$.data.checkinId").isString());

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].checked").value(true))
                .andExpect(jsonPath("$.data[0].checkinId").isString());

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, activeHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        assertThat(checkinCount(activeHabitId)).isEqualTo(1);

        mockMvc.perform(delete("/api/children/{childId}/habits/{childHabitId}/checkins/today", childId, activeHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.childHabitId").value(String.valueOf(activeHabitId)))
                .andExpect(jsonPath("$.data.checked").value(false))
                .andExpect(jsonPath("$.data.checkinId").doesNotExist());

        assertThat(checkinCount(activeHabitId)).isZero();

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].checked").value(false));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, activeHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.childHabitId").value(String.valueOf(activeHabitId)))
                .andExpect(jsonPath("$.data.checked").value(true))
                .andExpect(jsonPath("$.data.checkinId").isString());

        assertThat(checkinCount(activeHabitId)).isEqualTo(1);
        assertThat(totalCheckinRows(activeHabitId)).isEqualTo(1);
    }

    @Test
    void member_without_permission_sees_today_card_but_cannot_checkin() throws Exception {
        String ownerOpenid = uniqueOpenid("do");
        String memberOpenid = uniqueOpenid("dm");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Deny Checkin Family", "Little Deny");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("make-bed"));
        joinFamily(memberOpenid, familyId);

        updatePermission(ownerOpenid, childId, childHabitId, """
                {
                  "permissionType": "OWNER_ONLY"
                }
                """);

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].childHabitId").value(String.valueOf(childHabitId)))
                .andExpect(jsonPath("$.data[0].checked").value(false))
                .andExpect(jsonPath("$.data[0].canCheckin").value(false));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        assertThat(checkinCount(childHabitId)).isZero();
    }

    @Test
    void specific_parent_permission_allows_selected_member_to_checkin() throws Exception {
        String ownerOpenid = uniqueOpenid("so");
        String memberOpenid = uniqueOpenid("sm");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Specific Checkin Family", "Little Specific");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));
        joinFamily(memberOpenid, familyId);
        Long memberId = memberId(familyId, memberOpenid);

        updatePermission(ownerOpenid, childId, childHabitId, """
                {
                  "permissionType": "SPECIFIC_PARENTS",
                  "allowedMemberIds": [%d]
                }
                """.formatted(memberId));

        mockMvc.perform(get("/api/children/{childId}/today", childId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].canCheckin").value(true));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checked").value(true));
    }

    private Long createFamilyAndReturnId(String ownerOpenid, String familyName, String childNickname) throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
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

    private String uniqueOpenid(String prefix) {
        return prefix + "-" + Long.toString(System.nanoTime(), 36);
    }

    private Long defaultChildId(Long familyId) {
        return jdbcTemplate.queryForObject(
                "select id from child_profile where family_id = ? and status = 'active' and del_flag = '0'",
                Long.class,
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

    private Long addTemplate(String openid, Long childId, Long templateId) throws Exception {
        mockMvc.perform(post("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateId": %d
                                }
                                """.formatted(templateId)))
                .andExpect(status().isOk());
        return jdbcTemplate.queryForObject(
                "select id from habit_child_config where child_id = ? and template_id = ? and del_flag = '0'",
                Long.class,
                childId,
                templateId
        );
    }

    private void updateStatus(String openid, Long childId, Long childHabitId, String status) throws Exception {
        mockMvc.perform(patch("/api/children/{childId}/habits/{childHabitId}/status", childId, childHabitId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "%s"
                                }
                                """.formatted(status)))
                .andExpect(status().isOk());
    }

    private void updatePermission(String openid, Long childId, Long childHabitId, String body) throws Exception {
        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isOk());
    }

    private void joinFamily(String openid, Long familyId) throws Exception {
        String inviteCode = jdbcTemplate.queryForObject(
                "select code from family_invite_code where family_id = ? and status = 'active'",
                String.class,
                familyId
        );
        mockMvc.perform(post("/api/families/join")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Member")
                        .contentType("application/json")
                        .content("""
                                {
                                  "inviteCode": "%s"
                                }
                                """.formatted(inviteCode)))
                .andExpect(status().isOk());
    }

    private Long memberId(Long familyId, String openid) {
        return jdbcTemplate.queryForObject(
                """
                select fm.id
                from family_member fm
                join auth_user_account aua on aua.id = fm.user_id
                where fm.family_id = ? and aua.openid = ? and fm.del_flag = '0'
                """,
                Long.class,
                familyId,
                openid
        );
    }

    private Long checkinCount(Long childHabitId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_checkin_record where child_habit_id = ? and del_flag = '0'",
                Long.class,
                childHabitId
        );
    }

    private Long totalCheckinRows(Long childHabitId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_checkin_record where child_habit_id = ?",
                Long.class,
                childHabitId
        );
    }
}
