package com.physicalyy.habittracking.db;

import com.physicalyy.habittracking.HabitTrackingApplication;
import com.physicalyy.habittracking.modules.checkin.mapper.HabitCheckinRecordMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildAllowedMemberMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildConfigMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitTemplateMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = HabitTrackingApplication.class)
class MapperRegistrationTest {

    @Autowired
    private HabitTemplateMapper habitTemplateMapper;

    @Autowired
    private HabitChildConfigMapper habitChildConfigMapper;

    @Autowired
    private HabitChildAllowedMemberMapper habitChildAllowedMemberMapper;

    @Autowired
    private HabitCheckinRecordMapper habitCheckinRecordMapper;

    @Test
    void registers_habit_and_checkin_mappers() {
        assertThat(habitTemplateMapper).isNotNull();
        assertThat(habitChildConfigMapper).isNotNull();
        assertThat(habitChildAllowedMemberMapper).isNotNull();
        assertThat(habitCheckinRecordMapper).isNotNull();
    }
}
