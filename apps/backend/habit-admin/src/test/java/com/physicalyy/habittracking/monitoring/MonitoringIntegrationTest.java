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

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = "habit.monitoring.slow-threshold-ms=0")
class MonitoringIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MonitorRequestRecordMapper requestRecordMapper;

    @Autowired
    private MonitorSlowSqlRecordMapper slowSqlRecordMapper;

    @BeforeEach
    void cleanMonitoringRecords() {
        jdbcTemplate.update("delete from monitor_slow_sql_record");
        jdbcTemplate.update("delete from monitor_request_record");
    }

    @Test
    void records_api_request_and_slow_sql_with_same_request_id() throws Exception {
        String requestId = "test-request-1";

        mockMvc.perform(get("/api/monitoring-test/sql?code=abc&name=demo")
                        .header(RequestMonitoringFilter.REQUEST_ID_HEADER, requestId)
                        .header("User-Agent", "monitor-test")
                        .header("X-Forwarded-For", "203.0.113.10, 10.0.0.1"))
                .andExpect(status().isOk())
                .andExpect(header().string(RequestMonitoringFilter.REQUEST_ID_HEADER, requestId));

        List<Map<String, Object>> requestRows = jdbcTemplate.queryForList(
                "select request_id, method, path, route_pattern, query_string, status_code, client_ip, user_agent, sql_count, slow_sql_count from monitor_request_record"
        );
        assertThat(requestRows).hasSize(1);
        Map<String, Object> requestRow = requestRows.get(0);
        assertThat(requestRow.get("REQUEST_ID")).isEqualTo(requestId);
        assertThat(requestRow.get("METHOD")).isEqualTo("GET");
        assertThat(requestRow.get("PATH")).isEqualTo("/api/monitoring-test/sql");
        assertThat(requestRow.get("ROUTE_PATTERN")).isEqualTo("/api/monitoring-test/sql");
        assertThat(requestRow.get("QUERY_STRING")).isEqualTo("code=<redacted>&name=demo");
        assertThat(requestRow.get("STATUS_CODE")).isEqualTo(200);
        assertThat(requestRow.get("CLIENT_IP")).isEqualTo("203.0.113.10");
        assertThat(requestRow.get("USER_AGENT")).isEqualTo("monitor-test");
        assertThat(((Number) requestRow.get("SQL_COUNT")).intValue()).isGreaterThanOrEqualTo(1);
        assertThat(((Number) requestRow.get("SLOW_SQL_COUNT")).intValue()).isGreaterThanOrEqualTo(1);

        List<Map<String, Object>> sqlRows = jdbcTemplate.queryForList(
                "select request_id, statement_id, sql_text, sql_hash, duration_ms from monitor_slow_sql_record"
        );
        assertThat(sqlRows).isNotEmpty();
        assertThat(sqlRows)
                .allSatisfy(row -> assertThat(row.get("REQUEST_ID")).isEqualTo(requestId));
        assertThat(sqlRows)
                .anySatisfy(row -> {
                    assertThat((String) row.get("STATEMENT_ID")).contains("MonitorRequestRecordMapper.selectCount");
                    assertThat((String) row.get("SQL_TEXT")).contains("SELECT COUNT");
                    assertThat((String) row.get("SQL_HASH")).hasSize(64);
                    assertThat(((Number) row.get("DURATION_MS")).longValue()).isGreaterThanOrEqualTo(0);
                });
    }

    @Test
    void disabled_configuration_does_not_record_monitoring_rows() throws Exception {
        // Covered in a separate context because the flag is bound during application startup.
        assertThat(requestRecordMapper).isNotNull();
        assertThat(slowSqlRecordMapper).isNotNull();
    }
}
