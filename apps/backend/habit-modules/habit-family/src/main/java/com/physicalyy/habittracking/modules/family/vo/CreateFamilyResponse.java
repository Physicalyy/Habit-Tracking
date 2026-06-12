package com.physicalyy.habittracking.modules.family.vo;

public record CreateFamilyResponse(
        FamilySummary family,
        ChildSummary child,
        InviteCodeSummary inviteCode
) {
}
