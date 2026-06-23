package com.physicalyy.habittracking.modules.growthpartner.vo;

import java.util.List;

public record ChildGrowthPartnerState(
        boolean adopted,
        ChildGrowthPartnerSummary partner,
        GrowthPartnerStageSummary currentStage,
        GrowthPartnerStageSummary nextStage,
        List<GrowthPartnerStageSummary> stages
) {
}
