package com.physicalyy.habittracking.modules.family.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFamilyRequest(
        @NotBlank
        @Size(max = 64)
        String name,

        @NotBlank
        @Size(max = 64)
        String childNickname
) {
}
