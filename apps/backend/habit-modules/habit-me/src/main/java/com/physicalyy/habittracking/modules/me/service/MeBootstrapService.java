package com.physicalyy.habittracking.modules.me.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.entity.FamilyGroup;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyGroupMapper;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.family.vo.ChildSummary;
import com.physicalyy.habittracking.modules.family.vo.FamilySummary;
import com.physicalyy.habittracking.modules.me.vo.BootstrapResponse;
import com.physicalyy.habittracking.modules.me.vo.CurrentUserSummary;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MeBootstrapService {

    private final CurrentUserService currentUserService;
    private final FamilyMemberMapper familyMemberMapper;
    private final FamilyGroupMapper familyGroupMapper;
    private final ChildProfileMapper childProfileMapper;

    public MeBootstrapService(
            CurrentUserService currentUserService,
            FamilyMemberMapper familyMemberMapper,
            FamilyGroupMapper familyGroupMapper,
            ChildProfileMapper childProfileMapper
    ) {
        this.currentUserService = currentUserService;
        this.familyMemberMapper = familyMemberMapper;
        this.familyGroupMapper = familyGroupMapper;
        this.childProfileMapper = childProfileMapper;
    }

    public BootstrapResponse bootstrap(String openid, String nickname) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        List<FamilyMember> members = familyMemberMapper.selectList(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getUserId, user.getId())
                .eq(FamilyMember::getStatus, "active")
                .eq(FamilyMember::getDelFlag, "0")
                .orderByAsc(FamilyMember::getJoinedTime));

        List<FamilySummary> families = new ArrayList<>();
        FamilySummary defaultFamily = null;
        ChildSummary defaultChild = null;
        for (FamilyMember member : members) {
            FamilyGroup family = familyGroupMapper.selectById(member.getFamilyId());
            if (family == null || !"active".equals(family.getStatus()) || !"0".equals(family.getDelFlag())) {
                continue;
            }
            FamilySummary summary = new FamilySummary(
                    family.getId(),
                    family.getName(),
                    member.getId().equals(family.getAdminMemberId())
            );
            families.add(summary);
            if (defaultFamily == null) {
                defaultFamily = summary;
                defaultChild = findDefaultChild(family.getId());
            }
        }

        return new BootstrapResponse(
                families.isEmpty(),
                new CurrentUserSummary(user.getId(), user.getOpenid(), user.getNickname()),
                families,
                defaultFamily,
                defaultChild
        );
    }

    private ChildSummary findDefaultChild(Long familyId) {
        ChildProfile child = childProfileMapper.selectOne(new LambdaQueryWrapper<ChildProfile>()
                .eq(ChildProfile::getFamilyId, familyId)
                .eq(ChildProfile::getStatus, "active")
                .eq(ChildProfile::getDelFlag, "0")
                .orderByAsc(ChildProfile::getCreateTime)
                .last("limit 1"));
        if (child == null) {
            return null;
        }
        return new ChildSummary(child.getId(), child.getFamilyId(), child.getNickname());
    }
}
