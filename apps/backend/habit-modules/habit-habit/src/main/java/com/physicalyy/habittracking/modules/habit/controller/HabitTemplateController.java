package com.physicalyy.habittracking.modules.habit.controller;

import com.physicalyy.habittracking.common.api.vo.ApiResult;
import com.physicalyy.habittracking.modules.habit.service.HabitTemplateService;
import com.physicalyy.habittracking.modules.habit.vo.HabitTemplateSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/habit-templates")
public class HabitTemplateController {

    private final HabitTemplateService habitTemplateService;

    public HabitTemplateController(HabitTemplateService habitTemplateService) {
        this.habitTemplateService = habitTemplateService;
    }

    @GetMapping
    public ApiResult<List<HabitTemplateSummary>> listTemplates(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sourceType
    ) {
        return ApiResult.ok(habitTemplateService.listTemplates(category, keyword, sourceType));
    }
}
