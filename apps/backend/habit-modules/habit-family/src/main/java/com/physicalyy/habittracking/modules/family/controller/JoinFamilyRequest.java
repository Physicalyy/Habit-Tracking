package com.physicalyy.habittracking.modules.family.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record JoinFamilyRequest(
        @NotBlank
        @Pattern(regexp = "\\d{6}")
        String inviteCode
) {
}
