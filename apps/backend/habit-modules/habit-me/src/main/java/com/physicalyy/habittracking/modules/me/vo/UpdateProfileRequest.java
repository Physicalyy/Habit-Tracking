package com.physicalyy.habittracking.modules.me.vo;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 64)
        String nickname,

        @Size(max = 512)
        String avatarUrl
) {
}
