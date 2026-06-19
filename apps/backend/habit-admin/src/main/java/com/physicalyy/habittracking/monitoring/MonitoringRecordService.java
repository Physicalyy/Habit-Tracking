package com.physicalyy.habittracking.monitoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class MonitoringRecordService {

    private static final Logger log = LoggerFactory.getLogger(MonitoringRecordService.class);

    private final MonitorRequestRecordMapper requestRecordMapper;

    private final MonitorSlowSqlRecordMapper slowSqlRecordMapper;

    public MonitoringRecordService(
            MonitorRequestRecordMapper requestRecordMapper,
            MonitorSlowSqlRecordMapper slowSqlRecordMapper
    ) {
        this.requestRecordMapper = requestRecordMapper;
        this.slowSqlRecordMapper = slowSqlRecordMapper;
    }

    public void saveRequestRecord(MonitorRequestRecord record) {
        MonitoringContext.runSuppressed(() -> {
            try {
                requestRecordMapper.insert(record);
            } catch (RuntimeException ex) {
                log.warn("Failed to save request monitoring record: {}", ex.getClass().getSimpleName());
            }
        });
    }

    public void saveSlowSqlRecord(MonitorSlowSqlRecord record) {
        MonitoringContext.runSuppressed(() -> {
            try {
                slowSqlRecordMapper.insert(record);
            } catch (RuntimeException ex) {
                log.warn("Failed to save slow SQL monitoring record: {}", ex.getClass().getSimpleName());
            }
        });
    }
}
