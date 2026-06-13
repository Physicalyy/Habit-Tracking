package com.physicalyy.habittracking.modules.habit.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class ChildHabitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void add_system_template_creates_child_habit_snapshot_and_blocks_duplicate() throws Exception {
        String openid = "habit-owner-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(openid, "Seed Family", "Little Seed");
        Long childId = defaultChildId(familyId);
        Long templateId = templateId("drink-water");

        mockMvc.perform(post("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateId": %d
                                }
                                """.formatted(templateId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.childId").value(childId))
                .andExpect(jsonPath("$.data.templateId").value(templateId))
                .andExpect(jsonPath("$.data.name").value("主动喝水"))
                .andExpect(jsonPath("$.data.description").value("白天主动喝水，保持身体水分充足。"))
                .andExpect(jsonPath("$.data.iconKey").value("water_drop"))
                .andExpect(jsonPath("$.data.permissionType").value("ALL_PARENTS"))
                .andExpect(jsonPath("$.data.status").value("active"));

        Long childHabitId = childHabitId(childId, templateId);
        assertThat(childHabitId).isNotNull();

        mockMvc.perform(get("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id").value(hasItem(childHabitId)))
                .andExpect(jsonPath("$.data[*].name").value(hasItem("主动喝水")))
                .andExpect(jsonPath("$.data[*].permissionType").value(hasItem("ALL_PARENTS")));

        mockMvc.perform(post("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "templateId": %d
                                }
                                """.formatted(templateId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        assertThat(countChildHabit(childId, templateId)).isEqualTo(1);
    }

    @Test
    void create_custom_template_also_creates_child_habit_with_default_permission() throws Exception {
        String openid = "custom-owner-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(openid, "Custom Family", "Little Custom");
        Long childId = defaultChildId(familyId);

        mockMvc.perform(post("/api/habit-templates/custom")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "childId": %d,
                                  "name": "Practice Piano",
                                  "description": "Practice for ten minutes.",
                                  "category": "LEARNING",
                                  "iconKey": "piano"
                                }
                                """.formatted(childId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.template.sourceType").value("CUSTOM"))
                .andExpect(jsonPath("$.data.template.familyId").value(familyId))
                .andExpect(jsonPath("$.data.childHabit.childId").value(childId))
                .andExpect(jsonPath("$.data.childHabit.name").value("Practice Piano"))
                .andExpect(jsonPath("$.data.childHabit.permissionType").value("ALL_PARENTS"))
                .andExpect(jsonPath("$.data.childHabit.status").value("active"));

        Long templateId = jdbcTemplate.queryForObject(
                "select id from habit_template where name = ? and source_type = 'CUSTOM' and family_id = ?",
                Long.class,
                "Practice Piano",
                familyId
        );
        assertThat(countChildHabit(childId, templateId)).isEqualTo(1);
    }

    @Test
    void update_child_habit_status_disables_and_reenables_config() throws Exception {
        String openid = "status-owner-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(openid, "Status Family", "Little Status");
        Long childId = defaultChildId(familyId);
        Long templateId = templateId("brush-teeth");
        Long childHabitId = addTemplate(openid, childId, templateId);

        mockMvc.perform(patch("/api/children/{childId}/habits/{childHabitId}/status", childId, childHabitId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "disabled"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("disabled"));

        mockMvc.perform(patch("/api/children/{childId}/habits/{childHabitId}/status", childId, childHabitId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "status": "active"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("active"));
    }

    @Test
    void update_child_habit_basic_fields_keeps_permission_and_status() throws Exception {
        String openid = "edit-owner-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(openid, "Edit Family", "Little Edit");
        Long childId = defaultChildId(familyId);
        Long templateId = templateId("make-bed");
        Long childHabitId = addTemplate(openid, childId, templateId);

        mockMvc.perform(patch("/api/children/{childId}/habits/{childHabitId}", childId, childHabitId)
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "Make Bed Carefully",
                                  "description": "Flatten the sheet and pillow.",
                                  "iconKey": "bed",
                                  "imageUrl": ""
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(childHabitId))
                .andExpect(jsonPath("$.data.name").value("Make Bed Carefully"))
                .andExpect(jsonPath("$.data.description").value("Flatten the sheet and pillow."))
                .andExpect(jsonPath("$.data.iconKey").value("bed"))
                .andExpect(jsonPath("$.data.permissionType").value("ALL_PARENTS"))
                .andExpect(jsonPath("$.data.status").value("active"));
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

    private Long childHabitId(Long childId, Long templateId) {
        return jdbcTemplate.queryForObject(
                "select id from habit_child_config where child_id = ? and template_id = ? and del_flag = '0'",
                Long.class,
                childId,
                templateId
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
        return childHabitId(childId, templateId);
    }

    private Long countChildHabit(Long childId, Long templateId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_child_config where child_id = ? and template_id = ? and del_flag = '0'",
                Long.class,
                childId,
                templateId
        );
    }
}
