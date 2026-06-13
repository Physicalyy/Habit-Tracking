package com.physicalyy.habittracking.modules.family.vo;

public record JoinFamilyResponse(
        FamilySummary family,
        ChildSummary child,
        FamilyMemberSummary member
) {
}
