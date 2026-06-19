package com.physicalyy.habittracking.modules.me.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.mapper.UserAccountMapper;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.me.vo.CurrentUserSummary;
import com.physicalyy.habittracking.modules.me.vo.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;

@Service
public class MeProfileService {

    private final CurrentUserService currentUserService;
    private final UserAccountMapper userAccountMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final AvatarStorageService avatarStorageService;

    public MeProfileService(
            CurrentUserService currentUserService,
            UserAccountMapper userAccountMapper,
            FamilyMemberMapper familyMemberMapper,
            AvatarStorageService avatarStorageService
    ) {
        this.currentUserService = currentUserService;
        this.userAccountMapper = userAccountMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.avatarStorageService = avatarStorageService;
    }

    @Transactional
    public String uploadAvatar(MultipartFile file) {
        UserAccount user = currentUserService.requireCurrentUser();
        String avatarUrl = avatarStorageService.saveAvatar(user, file);
        String previousAvatarUrl = user.getAvatarUrl();
        user.setAvatarUrl(avatarUrl);
        user.touchForUpdate(user.getOpenid());
        userAccountMapper.updateById(user);
        avatarStorageService.deleteIfLocalAvatar(previousAvatarUrl);
        return avatarUrl;
    }

    @Transactional
    public CurrentUserSummary updateProfile(UpdateProfileRequest request) {
        UserAccount user = currentUserService.requireCurrentUser();
        String nickname = normalizeNickname(request.nickname(), user.getNickname());
        String avatarUrl = normalizeAvatarUrl(request.avatarUrl(), user.getAvatarUrl());
        avatarStorageService.validateAvatarUrl(user, avatarUrl);

        boolean changed = !Objects.equals(nickname, user.getNickname()) || !Objects.equals(avatarUrl, user.getAvatarUrl());
        if (changed) {
            user.setNickname(nickname);
            user.setAvatarUrl(avatarUrl);
            user.touchForUpdate(user.getOpenid());
            userAccountMapper.updateById(user);
            syncFamilyMemberDisplayName(user, nickname);
        }
        return toSummary(user);
    }

    public static CurrentUserSummary toSummary(UserAccount user) {
        return new CurrentUserSummary(
                user.getId(),
                user.getOpenid(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.isProfileCompleted()
        );
    }

    private String normalizeNickname(String nickname, String currentNickname) {
        String trimmed = nickname == null ? "" : nickname.trim();
        if (StringUtils.hasText(trimmed)) {
            return trimmed;
        }
        return StringUtils.hasText(currentNickname) ? currentNickname : UserAccount.DEFAULT_NICKNAME;
    }

    private String normalizeAvatarUrl(String avatarUrl, String currentAvatarUrl) {
        String trimmed = avatarUrl == null ? "" : avatarUrl.trim();
        if (StringUtils.hasText(trimmed)) {
            return trimmed;
        }
        return currentAvatarUrl;
    }

    private void syncFamilyMemberDisplayName(UserAccount user, String nickname) {
        if (!StringUtils.hasText(nickname)) {
            return;
        }
        List<FamilyMember> members = familyMemberMapper.selectList(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getUserId, user.getId())
                .eq(FamilyMember::getStatus, "active")
                .eq(FamilyMember::getDelFlag, "0"));
        for (FamilyMember member : members) {
            if (!nickname.equals(member.getDisplayName())) {
                member.setDisplayName(nickname);
                member.touchForUpdate(user.getOpenid());
                familyMemberMapper.updateById(member);
            }
        }
    }
}
