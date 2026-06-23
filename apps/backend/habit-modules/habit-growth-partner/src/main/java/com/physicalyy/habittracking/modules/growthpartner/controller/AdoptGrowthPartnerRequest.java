package com.physicalyy.habittracking.modules.growthpartner.controller;

import jakarta.validation.constraints.NotBlank;

public record AdoptGrowthPartnerRequest(
        @NotBlank String templateCode
) {
}
