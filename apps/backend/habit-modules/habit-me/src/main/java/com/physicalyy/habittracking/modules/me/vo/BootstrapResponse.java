package com.physicalyy.habittracking.modules.me.vo;

import com.physicalyy.habittracking.modules.family.vo.ChildSummary;
import com.physicalyy.habittracking.modules.family.vo.FamilySummary;

import java.util.List;

public record BootstrapResponse(
        boolean needOnboarding,
        CurrentUserSummary currentUser,
        List<FamilySummary> families,
        FamilySummary defaultFamily,
        ChildSummary defaultChild
) {
}
