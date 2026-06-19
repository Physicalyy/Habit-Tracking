package com.physicalyy.habittracking.monitoring;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MonitorSlowSqlRecordMapper extends BaseMapper<MonitorSlowSqlRecord> {
}
