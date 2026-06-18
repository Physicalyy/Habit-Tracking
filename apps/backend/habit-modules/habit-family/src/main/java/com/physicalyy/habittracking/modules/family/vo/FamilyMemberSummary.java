package com.physicalyy.habittracking.modules.family.vo;

public record FamilyMemberSummary(
        Long id,
        Long familyId,
        Long userId,
        String displayName,
        boolean admin
) {
}
