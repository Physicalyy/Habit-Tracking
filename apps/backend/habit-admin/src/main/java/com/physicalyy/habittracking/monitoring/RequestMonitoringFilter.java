package com.physicalyy.habittracking.monitoring;

import com.physicalyy.habittracking.modules.auth.service.AuthenticationContext;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserIdentity;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
public class RequestMonitoringFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    private final MonitoringProperties properties;

    private final MonitoringRecordService monitoringRecordService;

    private final MonitoringTextSanitizer sanitizer;

    private final AuthenticationContext authenticationContext;

    public RequestMonitoringFilter(
            MonitoringProperties properties,
            MonitoringRecordService monitoringRecordService,
            MonitoringTextSanitizer sanitizer,
            AuthenticationContext authenticationContext
    ) {
        this.properties = properties;
        this.monitoringRecordService = monitoringRecordService;
        this.sanitizer = sanitizer;
        this.authenticationContext = authenticationContext;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.isEnabled() || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        LocalDateTime startTime = LocalDateTime.now();
        long startNanos = System.nanoTime();
        MonitoringContext.RequestTrace trace = MonitoringContext.start(requestId, startTime, startNanos);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        Throwable failure = null;
        try {
            filterChain.doFilter(request, response);
        } catch (Throwable ex) {
            failure = ex;
            throw ex;
        } finally {
            try {
                saveRecord(request, response, trace, failure);
            } finally {
                MonitoringContext.clear();
            }
        }
    }

    private void saveRecord(
            HttpServletRequest request,
            HttpServletResponse response,
            MonitoringContext.RequestTrace trace,
            Throwable failure
    ) {
        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - trace.startNanos());
        Optional<CurrentUserIdentity> currentUser = authenticationContext.currentUserIdentity();
        MonitorRequestRecord record = new MonitorRequestRecord();
        record.setRequestId(trace.requestId());
        record.setMethod(sanitizer.truncate(request.getMethod(), 16));
        record.setPath(sanitizer.truncate(request.getRequestURI(), 512));
        record.setRoutePattern(sanitizer.truncate(routePattern(request), 512));
        record.setQueryString(sanitizer.sanitizeQuery(request.getQueryString(), properties.getMaxQueryStringLength()));
        record.setStatusCode(statusCode(response, failure));
        record.setDurationMs(durationMs);
        record.setClientIp(sanitizer.truncate(clientIp(request), 64));
        record.setUserAgent(sanitizer.truncate(request.getHeader("User-Agent"), 512));
        record.setUserId(currentUser.map(CurrentUserIdentity::userId).orElse(null));
        record.setOpenid(sanitizer.truncate(currentUser.map(CurrentUserIdentity::openid).orElse(null), 128));
        record.setExceptionClass(failure == null ? null : failure.getClass().getName());
        record.setSqlCount(trace.sqlCount());
        record.setSlowSqlCount(trace.slowSqlCount());
        record.setStartTime(trace.startTime());
        record.setCreateTime(LocalDateTime.now());
        monitoringRecordService.saveRequestRecord(record);
    }

    private String resolveRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (!StringUtils.hasText(requestId)) {
            return MonitoringContext.newRequestId();
        }
        return sanitizer.truncate(requestId.trim(), 64);
    }

    private int statusCode(HttpServletResponse response, Throwable failure) {
        int status = response.getStatus();
        if (failure != null && status < 400) {
            return HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
        }
        return status;
    }

    private String routePattern(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        if (pattern instanceof String) {
            String value = (String) pattern;
            if (!StringUtils.hasText(value)) {
                return null;
            }
            return value;
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",", 2)[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
