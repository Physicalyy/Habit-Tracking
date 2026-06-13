package com.physicalyy.habittracking.modules.habit.vo;

public record CreateCustomHabitResponse(
        CustomHabitTemplateSummary template,
        ChildHabitSummary childHabit
) {
}
