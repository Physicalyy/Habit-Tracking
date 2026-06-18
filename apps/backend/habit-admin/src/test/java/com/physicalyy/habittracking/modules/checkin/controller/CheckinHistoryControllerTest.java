package com.physicalyy.habittracking.modules.checkin.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class CheckinHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void history_lists_checkins_and_keeps_snapshot_after_habit_disabled() throws Exception {
        String ownerOpenid = uniqueOpenid("ho");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "History Family", "Little History");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk());
        updateStatus(ownerOpenid, childId, childHabitId, "disabled");

        mockMvc.perform(get("/api/children/{childId}/checkins", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].childHabitId").value(String.valueOf(childHabitId)))
                .andExpect(jsonPath("$.data[0].habitName").value("主动喝水"))
                .andExpect(jsonPath("$.data[0].iconKey").value("water_drop"))
                .andExpect(jsonPath("$.data[0].checkinDate").isString());

        mockMvc.perform(get("/api/children/{childId}/checkins/summary", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCheckinCount").value(1))
                .andExpect(jsonPath("$.data.totalCheckinDays").value(1))
                .andExpect(jsonPath("$.data.childId").value(String.valueOf(childId)));
    }

    @Test
    void non_family_member_cannot_view_history() throws Exception {
        String ownerOpenid = uniqueOpenid("no");
        String strangerOpenid = uniqueOpenid("ns");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Private History Family", "Little Private");
        Long childId = defaultChildId(familyId);

        mockMvc.perform(get("/api/children/{childId}/checkins", childId)
                        .header("X-Test-Openid", strangerOpenid)
                        .header("X-Test-Nickname", "Stranger"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
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

    private String uniqueOpenid(String prefix) {
        return prefix + "-" + Long.toString(System.nanoTime(), 36);
    }
}
