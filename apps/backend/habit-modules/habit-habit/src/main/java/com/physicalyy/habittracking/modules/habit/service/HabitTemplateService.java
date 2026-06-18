package com.physicalyy.habittracking.modules.habit.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.modules.habit.entity.HabitTemplate;
import com.physicalyy.habittracking.modules.habit.mapper.HabitTemplateMapper;
import com.physicalyy.habittracking.modules.habit.vo.HabitTemplateSummary;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class HabitTemplateService {

    private final HabitTemplateMapper habitTemplateMapper;

    public HabitTemplateService(HabitTemplateMapper habitTemplateMapper) {
        this.habitTemplateMapper = habitTemplateMapper;
    }

    public List<HabitTemplateSummary> listTemplates(String category, String keyword, String sourceType) {
        LambdaQueryWrapper<HabitTemplate> query = new LambdaQueryWrapper<HabitTemplate>()
                .eq(HabitTemplate::getStatus, "active")
                .eq(HabitTemplate::getDelFlag, "0")
                .orderByAsc(HabitTemplate::getCategory)
                .orderByAsc(HabitTemplate::getName);

        if (StringUtils.hasText(category)) {
            query.eq(HabitTemplate::getCategory, category.trim());
        }
        if (StringUtils.hasText(sourceType)) {
            query.eq(HabitTemplate::getSourceType, sourceType.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String normalizedKeyword = keyword.trim();
            query.and(wrapper -> wrapper
                    .like(HabitTemplate::getName, normalizedKeyword)
                    .or()
                    .like(HabitTemplate::getDescription, normalizedKeyword)
            );
        }

        return habitTemplateMapper.selectList(query)
                .stream()
                .map(HabitTemplateSummary::from)
                .toList();
    }
}
