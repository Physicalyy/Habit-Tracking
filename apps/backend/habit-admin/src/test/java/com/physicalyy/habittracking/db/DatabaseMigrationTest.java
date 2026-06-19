package com.physicalyy.habittracking.db;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = HabitTrackingApplication.class)
class DatabaseMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void creates_v1_core_tables() {
        List<String> tables = jdbcTemplate.queryForList(
                "select lower(table_name) from information_schema.tables where table_schema = 'PUBLIC'",
                String.class
        );

        assertThat(tables).contains(
                "auth_user_account",
                "family_group",
                "family_member",
                "family_invite_code",
                "child_profile",
                "habit_template",
                "habit_child_config",
                "habit_child_allowed_member",
                "habit_checkin_record",
                "monitor_request_record",
                "monitor_slow_sql_record"
        );
    }
}
