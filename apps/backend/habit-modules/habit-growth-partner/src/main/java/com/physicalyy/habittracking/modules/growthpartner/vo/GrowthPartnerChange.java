package com.physicalyy.habittracking.modules.growthpartner.vo;

public record GrowthPartnerChange(
        int delta,
        int beforeGrowthPoints,
        int afterGrowthPoints,
        String beforeStageCode,
        String afterStageCode,
        boolean stageChanged,
        String animationType
) {
}
