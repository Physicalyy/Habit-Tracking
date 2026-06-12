package com.physicalyy.habittracking.modules.family.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.controller.CreateFamilyRequest;
import com.physicalyy.habittracking.modules.family.entity.FamilyGroup;
import com.physicalyy.habittracking.modules.family.entity.FamilyInviteCode;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyGroupMapper;
import com.physicalyy.habittracking.modules.family.mapper.FamilyInviteCodeMapper;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.family.vo.ChildSummary;
import com.physicalyy.habittracking.modules.family.vo.CreateFamilyResponse;
import com.physicalyy.habittracking.modules.family.vo.FamilySummary;
import com.physicalyy.habittracking.modules.family.vo.InviteCodeSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class FamilyService {

    private static final int INVITE_CODE_BOUND = 1_000_000;
    private static final int INVITE_CODE_MAX_RETRY = 5;

    private final CurrentUserService currentUserService;
    private final FamilyGroupMapper familyGroupMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final FamilyInviteCodeMapper familyInviteCodeMapper;
    private final ChildProfileMapper childProfileMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public FamilyService(
            CurrentUserService currentUserService,
            FamilyGroupMapper familyGroupMapper,
            FamilyMemberMapper familyMemberMapper,
            FamilyInviteCodeMapper familyInviteCodeMapper,
            ChildProfileMapper childProfileMapper
    ) {
        this.currentUserService = currentUserService;
        this.familyGroupMapper = familyGroupMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.familyInviteCodeMapper = familyInviteCodeMapper;
        this.childProfileMapper = childProfileMapper;
    }

    @Transactional
    public CreateFamilyResponse createFamily(String openid, String nickname, CreateFamilyRequest request) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        String operator = user.getOpenid();

        FamilyGroup family = new FamilyGroup();
        family.setName(request.name());
        family.setCreatedByUserId(user.getId());
        family.setStatus("active");
        family.touchForCreate(operator);
        familyGroupMapper.insert(family);

        FamilyMember member = new FamilyMember();
        member.setFamilyId(family.getId());
        member.setUserId(user.getId());
        member.setDisplayName(user.getNickname());
        member.setStatus("active");
        member.setJoinedTime(LocalDateTime.now());
        member.touchForCreate(operator);
        familyMemberMapper.insert(member);

        family.setAdminMemberId(member.getId());
        family.touchForUpdate(operator);
        familyGroupMapper.updateById(family);

        ChildProfile child = new ChildProfile();
        child.setFamilyId(family.getId());
        child.setNickname(request.childNickname());
        child.setStatus("active");
        child.touchForCreate(operator);
        childProfileMapper.insert(child);

        FamilyInviteCode inviteCode = new FamilyInviteCode();
        inviteCode.setFamilyId(family.getId());
        inviteCode.setCode(generateUniqueInviteCode());
        inviteCode.setStatus("active");
        inviteCode.setCreatedByMemberId(member.getId());
        inviteCode.setExpiresTime(LocalDateTime.now().plusDays(7));
        inviteCode.touchForCreate(operator);
        familyInviteCodeMapper.insert(inviteCode);

        return new CreateFamilyResponse(
                new FamilySummary(family.getId(), family.getName(), true),
                new ChildSummary(child.getId(), child.getFamilyId(), child.getNickname()),
                new InviteCodeSummary(inviteCode.getCode(), inviteCode.getStatus(), inviteCode.getExpiresTime())
        );
    }

    private String generateUniqueInviteCode() {
        for (int i = 0; i < INVITE_CODE_MAX_RETRY; i++) {
            String code = String.format("%06d", secureRandom.nextInt(INVITE_CODE_BOUND));
            Long count = familyInviteCodeMapper.selectCount(new LambdaQueryWrapper<FamilyInviteCode>()
                    .eq(FamilyInviteCode::getCode, code)
                    .eq(FamilyInviteCode::getDelFlag, "0"));
            if (count == 0) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate unique invite code");
    }
}
