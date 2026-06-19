package com.physicalyy.habittracking.monitoring;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = "habit.monitoring.enabled=false")
class MonitoringDisabledTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanMonitoringRecords() {
        jdbcTemplate.update("delete from monitor_slow_sql_record");
        jdbcTemplate.update("delete from monitor_request_record");
    }

    @Test
    void disabled_configuration_does_not_record_rows_or_request_id_header() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist(RequestMonitoringFilter.REQUEST_ID_HEADER));

        Integer requestCount = jdbcTemplate.queryForObject("select count(*) from monitor_request_record", Integer.class);
        Integer slowSqlCount = jdbcTemplate.queryForObject("select count(*) from monitor_slow_sql_record", Integer.class);
        assertThat(requestCount).isZero();
        assertThat(slowSqlCount).isZero();
    }
}
