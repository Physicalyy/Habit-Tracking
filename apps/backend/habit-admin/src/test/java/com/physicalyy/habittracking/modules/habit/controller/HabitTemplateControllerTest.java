package com.physicalyy.habittracking.modules.habit.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class HabitTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void list_habit_templates_returns_only_active_templates_with_display_fields() throws Exception {
        insertTemplate(910001L, "seed-read-books", "亲子阅读", "LEARNING", "每天阅读十分钟", 3, 12, "menu_book", "/assets/habits/read-books.png", "SYSTEM", "active");
        insertTemplate(910002L, "seed-drink-water", "测试饮水", "HEALTH", "测试主动饮水夹具", 0, 12, "water_drop", "", "SYSTEM", "active");
        insertTemplate(910003L, "seed-disabled", "停用模板", "HEALTH", "不可展示", 0, 12, "block", "", "SYSTEM", "disabled");

        mockMvc.perform(get("/api/habit-templates")
                        .param("category", "HEALTH")
                        .param("keyword", "饮水夹具")
                        .param("sourceType", "SYSTEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[*].slug").value(hasItem("seed-drink-water")))
                .andExpect(jsonPath("$.data[*].slug").value(not(hasItem("seed-disabled"))))
                .andExpect(jsonPath("$.data[0].name").value("测试饮水"))
                .andExpect(jsonPath("$.data[0].category").value("HEALTH"))
                .andExpect(jsonPath("$.data[0].ageMin").value(0))
                .andExpect(jsonPath("$.data[0].ageMax").value(12))
                .andExpect(jsonPath("$.data[0].iconKey").value("water_drop"))
                .andExpect(jsonPath("$.data[0].imageUrl").value(""))
                .andExpect(jsonPath("$.data[0].sourceType").value("SYSTEM"))
                .andExpect(jsonPath("$.data[0].status").value("active"));
    }

    @Test
    void list_habit_templates_filters_by_category_keyword_and_source_type() throws Exception {
        insertTemplate(920001L, "seed-clean-room", "整理房间", "LIFE_SKILLS", "保持卧室整洁", 6, 12, "home", "", "SYSTEM", "active");
        insertTemplate(920002L, "seed-clean-toys", "收拾玩具", "LIFE_SKILLS", "玩具归位", 0, 9, "toys", "", "SYSTEM", "active");
        insertTemplate(920003L, "seed-custom-piano", "练钢琴", "ART", "每天练琴", 4, 12, "piano", "", "CUSTOM", "active");

        mockMvc.perform(get("/api/habit-templates")
                        .param("category", "LIFE_SKILLS")
                        .param("keyword", "房间")
                        .param("sourceType", "SYSTEM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].slug").value("seed-clean-room"));
    }

    private void insertTemplate(
            Long id,
            String slug,
            String name,
            String category,
            String description,
            Integer ageMin,
            Integer ageMax,
            String iconKey,
            String imageUrl,
            String sourceType,
            String status
    ) {
        LocalDateTime now = LocalDateTime.now();
        jdbcTemplate.update("""
                        insert into habit_template (
                          id, slug, name, description, category, age_min, age_max, icon_key,
                          image_url, source_type, family_id, created_by_member_id, status,
                          create_by, create_time, update_by, update_time, del_flag, ts
                        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, ?, 'test', ?, 'test', ?, '0', ?)
                        """,
                id, slug, name, description, category, ageMin, ageMax, iconKey,
                imageUrl, sourceType, status, now, now, now
        );
    }
}
