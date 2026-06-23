package com.physicalyy.habittracking.modules.growthpartner.vo;

public record ChildGrowthPartnerSummary(
        Long id,
        Long childId,
        String templateCode,
        String name,
        String nickname,
        int growthPoints
) {
}
