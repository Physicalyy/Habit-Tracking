package com.physicalyy.habittracking.monitoring;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Component
@Intercepts({
        @Signature(type = Executor.class, method = "query", args = {
                MappedStatement.class,
                Object.class,
                org.apache.ibatis.session.RowBounds.class,
                org.apache.ibatis.session.ResultHandler.class
        }),
        @Signature(type = Executor.class, method = "update", args = {
                MappedStatement.class,
                Object.class
        })
})
public class SlowSqlMonitoringInterceptor implements Interceptor {

    private final MonitoringProperties properties;

    private final ObjectProvider<MonitoringRecordService> monitoringRecordService;

    private final MonitoringTextSanitizer sanitizer;

    public SlowSqlMonitoringInterceptor(
            MonitoringProperties properties,
            ObjectProvider<MonitoringRecordService> monitoringRecordService,
            MonitoringTextSanitizer sanitizer
    ) {
        this.properties = properties;
        this.monitoringRecordService = monitoringRecordService;
        this.sanitizer = sanitizer;
    }

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        if (!properties.isEnabled() || MonitoringContext.isSuppressed()) {
            return invocation.proceed();
        }
        MonitoringContext.RequestTrace trace = MonitoringContext.current();
        if (trace == null) {
            return invocation.proceed();
        }
        trace.incrementSqlCount();
        long startNanos = System.nanoTime();
        try {
            return invocation.proceed();
        } finally {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNanos);
            if (durationMs >= properties.getSlowThresholdMs()) {
                trace.incrementSlowSqlCount();
                saveSlowSql(invocation, trace.requestId(), durationMs);
            }
        }
    }

    private void saveSlowSql(Invocation invocation, String requestId, long durationMs) {
        Object[] args = invocation.getArgs();
        if (args.length == 0 || !(args[0] instanceof MappedStatement)) {
            return;
        }
        MappedStatement statement = (MappedStatement) args[0];
        Object parameter = args.length > 1 ? args[1] : null;
        BoundSql boundSql = statement.getBoundSql(parameter);
        String sqlText = sanitizer.normalizeSql(boundSql.getSql(), properties.getMaxSqlTextLength());
        MonitorSlowSqlRecord record = new MonitorSlowSqlRecord();
        record.setRequestId(requestId);
        record.setStatementId(sanitizer.truncate(statement.getId(), 256));
        record.setSqlCommandType(statement.getSqlCommandType() == null ? null : statement.getSqlCommandType().name());
        record.setSqlText(sqlText);
        record.setSqlHash(sanitizer.sha256Hex(sqlText));
        record.setDurationMs(durationMs);
        record.setCreateTime(LocalDateTime.now());
        MonitoringRecordService recordService = monitoringRecordService.getIfAvailable();
        if (recordService != null) {
            recordService.saveSlowSqlRecord(record);
        }
    }
}
