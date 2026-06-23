package com.physicalyy.habittracking.modules.growthpartner.vo;

import java.util.List;

public record GrowthPartnerTemplateSummary(
        String templateCode,
        String name,
        String description,
        String defaultAnimationType,
        List<GrowthPartnerStageSummary> stages
) {
}
