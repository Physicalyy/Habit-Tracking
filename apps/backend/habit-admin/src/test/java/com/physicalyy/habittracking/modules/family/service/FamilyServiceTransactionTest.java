package com.physicalyy.habittracking.modules.family.service;

import com.physicalyy.habittracking.HabitTrackingApplication;
import com.physicalyy.habittracking.modules.family.controller.CreateFamilyRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(classes = HabitTrackingApplication.class)
class FamilyServiceTransactionTest {

    @Autowired
    private FamilyService familyService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void create_family_rolls_back_when_child_insert_fails() {
        String openid = "rollback-openid-" + System.nanoTime();
        CreateFamilyRequest request = new CreateFamilyRequest("回滚家庭", "x".repeat(65));

        assertThatThrownBy(() -> familyService.createFamily(openid, "家长", request))
                .isInstanceOf(DataAccessException.class);

        assertThat(countBy("auth_user_account", "openid", openid)).isEqualTo(0);
        assertThat(countBy("family_group", "name", "回滚家庭")).isEqualTo(0);
    }

    private Long countBy(String table, String column, Object value) {
        return jdbcTemplate.queryForObject(
                "select count(*) from " + table + " where " + column + " = ? and del_flag = '0'",
                Long.class,
                value
        );
    }
}
