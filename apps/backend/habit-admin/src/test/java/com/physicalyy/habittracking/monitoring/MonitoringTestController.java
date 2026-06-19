package com.physicalyy.habittracking.monitoring;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.physicalyy.habittracking.common.api.vo.ApiResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/monitoring-test")
class MonitoringTestController {

    private final MonitorRequestRecordMapper requestRecordMapper;

    MonitoringTestController(MonitorRequestRecordMapper requestRecordMapper) {
        this.requestRecordMapper = requestRecordMapper;
    }

    @GetMapping("/sql")
    ApiResult<Long> sql() {
        return ApiResult.ok(requestRecordMapper.selectCount(new QueryWrapper<>()));
    }
}
