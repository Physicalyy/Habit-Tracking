package com.physicalyy.habittracking.modules.family.vo;

import java.time.LocalDateTime;

public record InviteCodeSummary(
        String code,
        String status,
        LocalDateTime expiresTime
) {
}
