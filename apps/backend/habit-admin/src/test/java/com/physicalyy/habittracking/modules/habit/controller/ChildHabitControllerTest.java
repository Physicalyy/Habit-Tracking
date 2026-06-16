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
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
                .andExpect(jsonPath("$.data.childId").value(String.valueOf(childId)))
                .andExpect(jsonPath("$.data.templateId").value(String.valueOf(templateId)))
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
                .andExpect(jsonPath("$.data[*].id").value(hasItem(String.valueOf(childHabitId))))
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
                .andExpect(jsonPath("$.data.template.familyId").value(String.valueOf(familyId)))
                .andExpect(jsonPath("$.data.childHabit.childId").value(String.valueOf(childId)))
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
                .andExpect(jsonPath("$.data.id").value(String.valueOf(childHabitId)))
                .andExpect(jsonPath("$.data.name").value("Make Bed Carefully"))
                .andExpect(jsonPath("$.data.description").value("Flatten the sheet and pillow."))
                .andExpect(jsonPath("$.data.iconKey").value("bed"))
                .andExpect(jsonPath("$.data.permissionType").value("ALL_PARENTS"))
                .andExpect(jsonPath("$.data.status").value("active"));
    }

    @Test
    void admin_updates_child_habit_permissions_and_replaces_specific_members() throws Exception {
        String ownerOpenid = "perm-owner-" + System.nanoTime();
        String memberOpenid = "perm-member-" + System.nanoTime();
        String secondMemberOpenid = "perm-second-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Permission Family", "Little Permission");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("drink-water"));
        joinFamily(memberOpenid, familyId);
        joinFamily(secondMemberOpenid, familyId);
        Long ownerMemberId = memberId(familyId, ownerOpenid);
        Long memberId = memberId(familyId, memberOpenid);
        Long secondMemberId = memberId(familyId, secondMemberOpenid);

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "OWNER_ONLY"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissionType").value("OWNER_ONLY"))
                .andExpect(jsonPath("$.data.allowedMemberIds.length()").value(0));

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "SPECIFIC_PARENTS",
                                  "allowedMemberIds": [%d, %d]
                                }
                """.formatted(memberId, secondMemberId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissionType").value("SPECIFIC_PARENTS"))
                .andExpect(jsonPath("$.data.allowedMemberIds[0]").value(String.valueOf(memberId)))
                .andExpect(jsonPath("$.data.allowedMemberIds[1]").value(String.valueOf(secondMemberId)));

        assertThat(allowedMemberCount(childHabitId)).isEqualTo(2);

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "SPECIFIC_PARENTS",
                                  "allowedMemberIds": [%d]
                                }
                                """.formatted(ownerMemberId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.allowedMemberIds[0]").value(String.valueOf(ownerMemberId)));

        assertThat(allowedMemberCount(childHabitId)).isEqualTo(1);

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "ALL_PARENTS"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.permissionType").value("ALL_PARENTS"))
                .andExpect(jsonPath("$.data.allowedMemberIds.length()").value(0));
    }

    @Test
    void member_parent_cannot_update_child_habit_permissions() throws Exception {
        String ownerOpenid = "deny-owner-" + System.nanoTime();
        String memberOpenid = "deny-member-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Deny Family", "Little Deny");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("brush-teeth"));
        joinFamily(memberOpenid, familyId);

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "OWNER_ONLY"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void admin_deletes_child_habit_softly_clears_permissions_and_allows_readding_template() throws Exception {
        String ownerOpenid = "del-owner-" + System.nanoTime();
        String memberOpenid = "del-member-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Delete Family", "Little Delete");
        Long childId = defaultChildId(familyId);
        Long templateId = templateId("drink-water");
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId);
        joinFamily(memberOpenid, familyId);
        Long memberId = memberId(familyId, memberOpenid);

        mockMvc.perform(put("/api/children/{childId}/habits/{childHabitId}/permissions", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner")
                        .contentType("application/json")
                        .content("""
                                {
                                  "permissionType": "SPECIFIC_PARENTS",
                                  "allowedMemberIds": [%d]
                                }
                                """.formatted(memberId)))
                .andExpect(status().isOk());
        assertThat(allowedMemberCount(childHabitId)).isEqualTo(1);

        mockMvc.perform(post("/api/children/{childId}/habits/{childHabitId}/checkins", childId, childHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/children/{childId}/habits/{childHabitId}", childId, childHabitId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/children/{childId}/habits", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id").value(not(hasItem(String.valueOf(childHabitId)))));

        mockMvc.perform(get("/api/children/{childId}/checkins", childId)
                        .header("X-Test-Openid", ownerOpenid)
                        .header("X-Test-Nickname", "Owner"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].childHabitId").value(String.valueOf(childHabitId)));

        assertThat(countDeletedChildHabit(childId, templateId)).isEqualTo(1);
        assertThat(allowedMemberCount(childHabitId)).isZero();

        Long nextChildHabitId = addTemplate(ownerOpenid, childId, templateId);
        assertThat(nextChildHabitId).isNotEqualTo(childHabitId);
        assertThat(countChildHabit(childId, templateId)).isEqualTo(1);
    }

    @Test
    void member_parent_cannot_delete_child_habit() throws Exception {
        String ownerOpenid = "dd-owner-" + System.nanoTime();
        String memberOpenid = "dd-member-" + System.nanoTime();
        Long familyId = createFamilyAndReturnId(ownerOpenid, "Delete Deny Family", "Little Deny");
        Long childId = defaultChildId(familyId);
        Long childHabitId = addTemplate(ownerOpenid, childId, templateId("brush-teeth"));
        joinFamily(memberOpenid, familyId);

        mockMvc.perform(delete("/api/children/{childId}/habits/{childHabitId}", childId, childHabitId)
                        .header("X-Test-Openid", memberOpenid)
                        .header("X-Test-Nickname", "Member"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        assertThat(countChildHabit(childId, templateId("brush-teeth"))).isEqualTo(1);
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

    private Long allowedMemberCount(Long childHabitId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_child_allowed_member where child_habit_id = ? and del_flag = '0'",
                Long.class,
                childHabitId
        );
    }

    private Long countChildHabit(Long childId, Long templateId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_child_config where child_id = ? and template_id = ? and del_flag = '0'",
                Long.class,
                childId,
                templateId
        );
    }

    private Long countDeletedChildHabit(Long childId, Long templateId) {
        return jdbcTemplate.queryForObject(
                "select count(*) from habit_child_config where child_id = ? and template_id = ? and del_flag = '1'",
                Long.class,
                childId,
                templateId
        );
    }
}
