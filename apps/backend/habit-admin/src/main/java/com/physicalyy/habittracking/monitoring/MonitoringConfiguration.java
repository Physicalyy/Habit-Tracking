package com.physicalyy.habittracking.monitoring;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MonitoringProperties.class)
public class MonitoringConfiguration {
}
