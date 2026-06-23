package com.physicalyy.habittracking.modules.growthpartner.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class GrowthPartnerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void lists_thunder_war_tiger_template_and_adopts_idempotently() throws Exception {
        String ownerOpenid = uniqueOpenid("gpo");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Growth Partner Family", "Little Dragon");
        Long childId = defaultChildId(familyId);

        mockMvc.perform(get("/api/growth-partner-templates")
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].templateCode").value("thunder-war-tiger"))
                .andExpect(jsonPath("$.data[0].name").value("雷纹战虎"))
                .andExpect(jsonPath("$.data[0].stages.length()").value(6))
                .andExpect(jsonPath("$.data[0].stages[0].stageCode").value("thunder-war-tiger-egg"))
                .andExpect(jsonPath("$.data[0].stages[0].requiredGrowthPoints").value(0))
                .andExpect(jsonPath("$.data[0].stages[1].requiredGrowthPoints").value(20))
                .andExpect(jsonPath("$.data[0].stages[2].requiredGrowthPoints").value(40))
                .andExpect(jsonPath("$.data[0].stages[3].requiredGrowthPoints").value(60))
                .andExpect(jsonPath("$.data[0].stages[4].requiredGrowthPoints").value(80))
                .andExpect(jsonPath("$.data[0].stages[5].requiredGrowthPoints").value(100));

        mockMvc.perform(get("/api/children/{childId}/growth-partner", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adopted").value(false))
                .andExpect(jsonPath("$.data.partner").value(nullValue()));

        String outsiderOpenid = uniqueOpenid("gpx");
        mockMvc.perform(get("/api/children/{childId}/growth-partner", childId)
                        .header("X-Test-Openid", outsiderOpenid)
                        .header("X-Test-Nickname", "Outsider"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/children/{childId}/growth-partner/adopt", childId)
                        .header("X-Test-Openid", outsiderOpenid)
                        .header("X-Test-Nickname", "Outsider")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateCode": "thunder-war-tiger"
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/children/{childId}/growth-partner/adopt", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateCode": "thunder-war-tiger"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adopted").value(true))
                .andExpect(jsonPath("$.data.partner.templateCode").value("thunder-war-tiger"))
                .andExpect(jsonPath("$.data.partner.nickname").value("雷纹战虎"))
                .andExpect(jsonPath("$.data.partner.growthPoints").value(0))
                .andExpect(jsonPath("$.data.currentStage.stageCode").value("thunder-war-tiger-egg"))
                .andExpect(jsonPath("$.data.nextStage.stageCode").value("thunder-war-tiger-cub"));

        mockMvc.perform(post("/api/children/{childId}/growth-partner/adopt", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateCode": "thunder-war-tiger"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partner.growthPoints").value(0));

        assertThat(childGrowthPartnerRows(childId)).isEqualTo(1);
    }

    @Test
    void checkin_adds_growth_points_once_and_undo_rolls_back_stage() throws Exception {
        String ownerOpenid = uniqueOpenid("gpc");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Growth Checkin Family", "Little Checkin");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));

        mockMvc.perform(post("/api/children/{childId}/growth-partner/adopt", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateCode": "thunder-war-tiger"
                                }
                                """))
                .andExpect(status().isOk());

        setGrowthPoints(childId, 39);

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checked").value(true))
                .andExpect(jsonPath("$.data.growthPartnerChange.delta").value(1))
                .andExpect(jsonPath("$.data.growthPartnerChange.beforeGrowthPoints").value(39))
                .andExpect(jsonPath("$.data.growthPartnerChange.afterGrowthPoints").value(40))
                .andExpect(jsonPath("$.data.growthPartnerChange.beforeStageCode").value("thunder-war-tiger-cub"))
                .andExpect(jsonPath("$.data.growthPartnerChange.afterStageCode").value("thunder-war-tiger-spark"))
                .andExpect(jsonPath("$.data.growthPartnerChange.stageChanged").value(true))
                .andExpect(jsonPath("$.data.growthPartnerChange.animationType").value("stage_upgrade"));

        assertThat(growthPoints(childId)).isEqualTo(40);
        assertThat(activeGrowthLogs(childId)).isEqualTo(1);

        mockMvc.perform(get("/api/children/{childId}/checkins", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].growthPartnerDelta").value(1));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isBadRequest());

        assertThat(growthPoints(childId)).isEqualTo(40);
        assertThat(totalGrowthLogs(childId)).isEqualTo(1);

        mockMvc.perform(delete("/api/children/{childId}/habits/{childHabitId}/checkins/today", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checked").value(false))
                .andExpect(jsonPath("$.data.growthPartnerChange.delta").value(-1))
                .andExpect(jsonPath("$.data.growthPartnerChange.beforeGrowthPoints").value(40))
                .andExpect(jsonPath("$.data.growthPartnerChange.afterGrowthPoints").value(39))
                .andExpect(jsonPath("$.data.growthPartnerChange.beforeStageCode").value("thunder-war-tiger-spark"))
                .andExpect(jsonPath("$.data.growthPartnerChange.afterStageCode").value("thunder-war-tiger-cub"))
                .andExpect(jsonPath("$.data.growthPartnerChange.stageChanged").value(true))
                .andExpect(jsonPath("$.data.growthPartnerChange.animationType").value("stage_downgrade"));

        assertThat(growthPoints(childId)).isEqualTo(39);
        assertThat(activeGrowthLogs(childId)).isZero();
        assertThat(totalGrowthLogs(childId)).isEqualTo(1);
    }

    @Test
    void checkin_without_adopted_partner_has_no_growth_change() throws Exception {
        String ownerOpenid = uniqueOpenid("gpn");
        Long familyId = createFamilyAndReturnId(ownerOpenid, "No Partner Family", "Little None");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checked").value(true))
                .andExpect(jsonPath("$.data.growthPartnerChange").doesNotExist());
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

    private Long childGrowthPartnerRows(Long childId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from child_growth_partner where child_id = ? and del_flag = '0'",
                Long.class,
                childId
        );
    }

    private void setGrowthPoints(Long childId, int growthPoints) {
        jdbcTemplate.update(
                "update child_growth_partner set growth_points = ? where child_id = ? and del_flag = '0'",
                growthPoints,
                childId
        );
    }

    private Integer growthPoints(Long childId) {
        return jdbcTemplate.queryForObject(
                "select growth_points from child_growth_partner where child_id = ? and del_flag = '0'",
                Integer.class,
                childId
        );
    }

    private Long activeGrowthLogs(Long childId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from growth_partner_log where child_id = ? and status = 'active' and del_flag = '0'",
                Long.class,
                childId
        );
    }

    private Long totalGrowthLogs(Long childId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from growth_partner_log where child_id = ?",
                Long.class,
                childId
        );
    }
}
