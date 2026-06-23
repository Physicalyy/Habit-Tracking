package com.physicalyy.habittracking.modules.growthpartner.vo;

public record GrowthPartnerStageSummary(
        String stageCode,
        String name,
        int requiredGrowthPoints,
        String imageUrl,
        String previewImageUrl,
        boolean unlocked
) {
}
