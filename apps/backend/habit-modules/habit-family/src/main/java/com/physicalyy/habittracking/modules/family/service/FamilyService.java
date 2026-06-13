package com.physicalyy.habittracking.modules.family.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.controller.CreateFamilyRequest;
import com.physicalyy.habittracking.modules.family.controller.JoinFamilyRequest;
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
import com.physicalyy.habittracking.modules.family.vo.FamilyMemberSummary;
import com.physicalyy.habittracking.modules.family.vo.JoinFamilyResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

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

    @Transactional
    public JoinFamilyResponse joinFamily(String openid, String nickname, JoinFamilyRequest request) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        String operator = user.getOpenid();
        LocalDateTime now = LocalDateTime.now();
        FamilyInviteCode inviteCode = findUsableInviteCode(request.inviteCode(), now);
        FamilyGroup family = findActiveFamily(inviteCode.getFamilyId());

        FamilyMember member = familyMemberMapper.selectOne(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFamilyId, family.getId())
                .eq(FamilyMember::getUserId, user.getId())
                .eq(FamilyMember::getDelFlag, "0")
                .last("limit 1"));
        if (member == null) {
            member = new FamilyMember();
            member.setFamilyId(family.getId());
            member.setUserId(user.getId());
            member.setDisplayName(user.getNickname());
            member.setStatus("active");
            member.setJoinedTime(now);
            member.touchForCreate(operator);
            familyMemberMapper.insert(member);
        } else if (!"active".equals(member.getStatus())) {
            member.setStatus("active");
            member.setDisplayName(user.getNickname());
            member.setJoinedTime(now);
            member.touchForUpdate(operator);
            familyMemberMapper.updateById(member);
        }

        ChildSummary child = findDefaultChild(family.getId());
        return new JoinFamilyResponse(
                new FamilySummary(family.getId(), family.getName(), member.getId().equals(family.getAdminMemberId())),
                child,
                new FamilyMemberSummary(
                        member.getId(),
                        member.getFamilyId(),
                        member.getUserId(),
                        member.getDisplayName(),
                        member.getId().equals(family.getAdminMemberId())
                )
        );
    }

    public InviteCodeSummary getActiveInviteCode(String openid, String nickname, Long familyId) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        FamilyGroup family = findActiveFamily(familyId);
        requireAdminMember(user.getId(), family);
        FamilyInviteCode inviteCode = findActiveInviteCodeByFamily(familyId);
        return new InviteCodeSummary(inviteCode.getCode(), inviteCode.getStatus(), inviteCode.getExpiresTime());
    }

    @Transactional
    public InviteCodeSummary refreshInviteCode(String openid, String nickname, Long familyId) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        FamilyGroup family = findActiveFamily(familyId);
        FamilyMember adminMember = requireAdminMember(user.getId(), family);
        String operator = user.getOpenid();

        List<FamilyInviteCode> activeCodes = familyInviteCodeMapper.selectList(new LambdaQueryWrapper<FamilyInviteCode>()
                .eq(FamilyInviteCode::getFamilyId, familyId)
                .eq(FamilyInviteCode::getStatus, "active")
                .eq(FamilyInviteCode::getDelFlag, "0"));
        for (FamilyInviteCode activeCode : activeCodes) {
            activeCode.setStatus("invalid");
            activeCode.touchForUpdate(operator);
            familyInviteCodeMapper.updateById(activeCode);
        }

        FamilyInviteCode inviteCode = new FamilyInviteCode();
        inviteCode.setFamilyId(familyId);
        inviteCode.setCode(generateUniqueInviteCode());
        inviteCode.setStatus("active");
        inviteCode.setCreatedByMemberId(adminMember.getId());
        inviteCode.setExpiresTime(LocalDateTime.now().plusDays(7));
        inviteCode.touchForCreate(operator);
        familyInviteCodeMapper.insert(inviteCode);

        return new InviteCodeSummary(inviteCode.getCode(), inviteCode.getStatus(), inviteCode.getExpiresTime());
    }

    private FamilyInviteCode findUsableInviteCode(String code, LocalDateTime now) {
        FamilyInviteCode inviteCode = familyInviteCodeMapper.selectOne(new LambdaQueryWrapper<FamilyInviteCode>()
                .eq(FamilyInviteCode::getCode, code)
                .eq(FamilyInviteCode::getStatus, "active")
                .eq(FamilyInviteCode::getDelFlag, "0")
                .last("limit 1"));
        if (inviteCode == null || inviteCode.getExpiresTime().isBefore(now)) {
            throw new BusinessException("BAD_REQUEST", "Invite code is invalid or expired");
        }
        return inviteCode;
    }

    private FamilyInviteCode findActiveInviteCodeByFamily(Long familyId) {
        FamilyInviteCode inviteCode = familyInviteCodeMapper.selectOne(new LambdaQueryWrapper<FamilyInviteCode>()
                .eq(FamilyInviteCode::getFamilyId, familyId)
                .eq(FamilyInviteCode::getStatus, "active")
                .eq(FamilyInviteCode::getDelFlag, "0")
                .orderByDesc(FamilyInviteCode::getCreateTime)
                .last("limit 1"));
        if (inviteCode == null) {
            throw new BusinessException("BAD_REQUEST", "Active invite code not found");
        }
        return inviteCode;
    }

    private FamilyGroup findActiveFamily(Long familyId) {
        FamilyGroup family = familyGroupMapper.selectById(familyId);
        if (family == null || !"active".equals(family.getStatus()) || !"0".equals(family.getDelFlag())) {
            throw new BusinessException("BAD_REQUEST", "Family not found");
        }
        return family;
    }

    private FamilyMember requireAdminMember(Long userId, FamilyGroup family) {
        FamilyMember member = familyMemberMapper.selectOne(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFamilyId, family.getId())
                .eq(FamilyMember::getUserId, userId)
                .eq(FamilyMember::getStatus, "active")
                .eq(FamilyMember::getDelFlag, "0")
                .last("limit 1"));
        if (member == null || !member.getId().equals(family.getAdminMemberId())) {
            throw new BusinessException("BAD_REQUEST", "Only family admin can manage invite code");
        }
        return member;
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
