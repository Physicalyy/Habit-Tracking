package com.physicalyy.habittracking.modules.habit.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.entity.FamilyGroup;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyGroupMapper;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.habit.controller.AddChildHabitRequest;
import com.physicalyy.habittracking.modules.habit.controller.CreateCustomHabitTemplateRequest;
import com.physicalyy.habittracking.modules.habit.controller.UpdateChildHabitRequest;
import com.physicalyy.habittracking.modules.habit.controller.UpdateChildHabitPermissionRequest;
import com.physicalyy.habittracking.modules.habit.controller.UpdateChildHabitStatusRequest;
import com.physicalyy.habittracking.modules.habit.entity.HabitChildAllowedMember;
import com.physicalyy.habittracking.modules.habit.entity.HabitChildConfig;
import com.physicalyy.habittracking.modules.habit.entity.HabitTemplate;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildAllowedMemberMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildConfigMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitTemplateMapper;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitPermissionSummary;
import com.physicalyy.habittracking.modules.habit.vo.ChildHabitSummary;
import com.physicalyy.habittracking.modules.habit.vo.CreateCustomHabitResponse;
import com.physicalyy.habittracking.modules.habit.vo.CustomHabitTemplateSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class ChildHabitService {

    private static final String DEFAULT_PERMISSION_TYPE = "ALL_PARENTS";

    private final CurrentUserService currentUserService;
    private final ChildProfileMapper childProfileMapper;
    private final FamilyGroupMapper familyGroupMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final HabitTemplateMapper habitTemplateMapper;
    private final HabitChildConfigMapper habitChildConfigMapper;
    private final HabitChildAllowedMemberMapper habitChildAllowedMemberMapper;

    public ChildHabitService(
            CurrentUserService currentUserService,
            ChildProfileMapper childProfileMapper,
            FamilyGroupMapper familyGroupMapper,
            FamilyMemberMapper familyMemberMapper,
            HabitTemplateMapper habitTemplateMapper,
            HabitChildConfigMapper habitChildConfigMapper,
            HabitChildAllowedMemberMapper habitChildAllowedMemberMapper
    ) {
        this.currentUserService = currentUserService;
        this.childProfileMapper = childProfileMapper;
        this.familyGroupMapper = familyGroupMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.habitTemplateMapper = habitTemplateMapper;
        this.habitChildConfigMapper = habitChildConfigMapper;
        this.habitChildAllowedMemberMapper = habitChildAllowedMemberMapper;
    }

    public List<ChildHabitSummary> listChildHabits(String openid, String nickname, Long childId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        return habitChildConfigMapper.selectList(new LambdaQueryWrapper<HabitChildConfig>()
                        .eq(HabitChildConfig::getFamilyId, context.familyId())
                        .eq(HabitChildConfig::getChildId, childId)
                        .eq(HabitChildConfig::getDelFlag, "0")
                        .orderByAsc(HabitChildConfig::getSortOrder)
                        .orderByAsc(HabitChildConfig::getCreateTime))
                .stream()
                .map(ChildHabitSummary::from)
                .toList();
    }

    @Transactional
    public ChildHabitSummary addSystemTemplate(String openid, String nickname, Long childId, AddChildHabitRequest request) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        HabitTemplate template = requireActiveTemplate(request.templateId());
        if (!"SYSTEM".equals(template.getSourceType())) {
            throw new BusinessException("BAD_REQUEST", "Only system templates can be added through this endpoint");
        }
        ensureNoDuplicate(childId, template.getId());

        HabitChildConfig childHabit = createChildHabitFromTemplate(context, template);
        habitChildConfigMapper.insert(childHabit);
        return ChildHabitSummary.from(childHabit);
    }

    @Transactional
    public CreateCustomHabitResponse createCustomHabit(String openid, String nickname, CreateCustomHabitTemplateRequest request) {
        ChildContext context = requireChildContext(openid, nickname, request.childId());
        String operator = context.user().getOpenid();

        HabitTemplate template = new HabitTemplate();
        template.setSlug(generateCustomSlug(request.name()));
        template.setName(request.name().trim());
        template.setDescription(trimToEmpty(request.description()));
        template.setCategory(trimToEmpty(request.category()));
        template.setAgeMin(null);
        template.setAgeMax(null);
        template.setIconKey(trimToEmpty(request.iconKey()));
        template.setImageUrl(trimToEmpty(request.imageUrl()));
        template.setSourceType("CUSTOM");
        template.setFamilyId(context.familyId());
        template.setCreatedByMemberId(context.member().getId());
        template.setStatus("active");
        template.touchForCreate(operator);
        habitTemplateMapper.insert(template);

        HabitChildConfig childHabit = createChildHabitFromTemplate(context, template);
        habitChildConfigMapper.insert(childHabit);

        return new CreateCustomHabitResponse(
                CustomHabitTemplateSummary.from(template),
                ChildHabitSummary.from(childHabit)
        );
    }

    @Transactional
    public ChildHabitSummary updateChildHabit(
            String openid,
            String nickname,
            Long childId,
            Long childHabitId,
            UpdateChildHabitRequest request
    ) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        HabitChildConfig childHabit = requireChildHabit(context, childHabitId);
        childHabit.setName(request.name().trim());
        childHabit.setDescription(trimToEmpty(request.description()));
        childHabit.setIconKey(trimToEmpty(request.iconKey()));
        childHabit.setImageUrl(trimToEmpty(request.imageUrl()));
        childHabit.touchForUpdate(context.user().getOpenid());
        habitChildConfigMapper.updateById(childHabit);
        return ChildHabitSummary.from(childHabit);
    }

    @Transactional
    public ChildHabitPermissionSummary updatePermissions(
            String openid,
            String nickname,
            Long childId,
            Long childHabitId,
            UpdateChildHabitPermissionRequest request
    ) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        requireAdminMember(context);
        HabitChildConfig childHabit = requireChildHabit(context, childHabitId);
        String permissionType = request.permissionType().trim();
        if (!List.of("ALL_PARENTS", "OWNER_ONLY", "SPECIFIC_PARENTS").contains(permissionType)) {
            throw new BusinessException("BAD_REQUEST", "Child habit permission type is invalid");
        }

        List<Long> allowedMemberIds = "SPECIFIC_PARENTS".equals(permissionType)
                ? normalizeAllowedMemberIds(request.allowedMemberIds())
                : List.of();
        if ("SPECIFIC_PARENTS".equals(permissionType) && allowedMemberIds.isEmpty()) {
            throw new BusinessException("BAD_REQUEST", "Allowed members are required");
        }
        for (Long familyMemberId : allowedMemberIds) {
            requireFamilyMember(context.familyId(), familyMemberId);
        }

        replaceAllowedMembers(childHabitId, allowedMemberIds, context.user().getOpenid());
        childHabit.setPermissionType(permissionType);
        childHabit.touchForUpdate(context.user().getOpenid());
        habitChildConfigMapper.updateById(childHabit);

        if ("SPECIFIC_PARENTS".equals(permissionType)) {
            upsertAllowedMembers(childHabitId, allowedMemberIds, context.user().getOpenid());
        }

        return new ChildHabitPermissionSummary(
                childHabit.getId(),
                childHabit.getChildId(),
                childHabit.getPermissionType(),
                "SPECIFIC_PARENTS".equals(permissionType) ? allowedMemberIds : List.of()
        );
    }

    @Transactional
    public ChildHabitSummary updateStatus(
            String openid,
            String nickname,
            Long childId,
            Long childHabitId,
            UpdateChildHabitStatusRequest request
    ) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        String status = request.status().trim();
        if (!"active".equals(status) && !"disabled".equals(status)) {
            throw new BusinessException("BAD_REQUEST", "Child habit status is invalid");
        }

        HabitChildConfig childHabit = requireChildHabit(context, childHabitId);
        childHabit.setStatus(status);
        childHabit.touchForUpdate(context.user().getOpenid());
        habitChildConfigMapper.updateById(childHabit);
        return ChildHabitSummary.from(childHabit);
    }

    private HabitChildConfig createChildHabitFromTemplate(ChildContext context, HabitTemplate template) {
        HabitChildConfig childHabit = new HabitChildConfig();
        childHabit.setFamilyId(context.familyId());
        childHabit.setChildId(context.child().getId());
        childHabit.setTemplateId(template.getId());
        childHabit.setName(template.getName());
        childHabit.setDescription(template.getDescription());
        childHabit.setIconKey(template.getIconKey());
        childHabit.setImageUrl(template.getImageUrl());
        childHabit.setPermissionType(DEFAULT_PERMISSION_TYPE);
        childHabit.setCreatedByMemberId(context.member().getId());
        childHabit.setStatus("active");
        childHabit.setSortOrder(0);
        childHabit.touchForCreate(context.user().getOpenid());
        return childHabit;
    }

    private ChildContext requireChildContext(String openid, String nickname, Long childId) {
        UserAccount user = currentUserService.requireCurrentUser(openid, nickname);
        ChildProfile child = childProfileMapper.selectOne(new LambdaQueryWrapper<ChildProfile>()
                .eq(ChildProfile::getId, childId)
                .eq(ChildProfile::getStatus, "active")
                .eq(ChildProfile::getDelFlag, "0")
                .last("limit 1"));
        if (child == null) {
            throw new BusinessException("BAD_REQUEST", "Child not found");
        }

        FamilyMember member = familyMemberMapper.selectOne(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFamilyId, child.getFamilyId())
                .eq(FamilyMember::getUserId, user.getId())
                .eq(FamilyMember::getStatus, "active")
                .eq(FamilyMember::getDelFlag, "0")
                .last("limit 1"));
        if (member == null) {
            throw new BusinessException("BAD_REQUEST", "Current user is not a family member");
        }
        return new ChildContext(user, child, child.getFamilyId(), member);
    }

    private HabitTemplate requireActiveTemplate(Long templateId) {
        HabitTemplate template = habitTemplateMapper.selectOne(new LambdaQueryWrapper<HabitTemplate>()
                .eq(HabitTemplate::getId, templateId)
                .eq(HabitTemplate::getStatus, "active")
                .eq(HabitTemplate::getDelFlag, "0")
                .last("limit 1"));
        if (template == null) {
            throw new BusinessException("BAD_REQUEST", "Habit template not found");
        }
        return template;
    }

    private HabitChildConfig requireChildHabit(ChildContext context, Long childHabitId) {
        HabitChildConfig childHabit = habitChildConfigMapper.selectOne(new LambdaQueryWrapper<HabitChildConfig>()
                .eq(HabitChildConfig::getId, childHabitId)
                .eq(HabitChildConfig::getFamilyId, context.familyId())
                .eq(HabitChildConfig::getChildId, context.child().getId())
                .eq(HabitChildConfig::getDelFlag, "0")
                .last("limit 1"));
        if (childHabit == null) {
            throw new BusinessException("BAD_REQUEST", "Child habit not found");
        }
        return childHabit;
    }

    private void ensureNoDuplicate(Long childId, Long templateId) {
        Long count = habitChildConfigMapper.selectCount(new LambdaQueryWrapper<HabitChildConfig>()
                .eq(HabitChildConfig::getChildId, childId)
                .eq(HabitChildConfig::getTemplateId, templateId)
                .eq(HabitChildConfig::getDelFlag, "0"));
        if (count > 0) {
            throw new BusinessException("BAD_REQUEST", "Child habit already exists");
        }
    }

    private List<Long> normalizeAllowedMemberIds(List<Long> allowedMemberIds) {
        if (allowedMemberIds == null || allowedMemberIds.isEmpty()) {
            return List.of();
        }
        List<Long> normalizedIds = new ArrayList<>();
        for (Long allowedMemberId : new LinkedHashSet<>(allowedMemberIds)) {
            if (allowedMemberId == null) {
                throw new BusinessException("BAD_REQUEST", "Allowed member is invalid");
            }
            normalizedIds.add(allowedMemberId);
        }
        return normalizedIds;
    }

    private void replaceAllowedMembers(Long childHabitId, List<Long> allowedMemberIds, String operator) {
        List<HabitChildAllowedMember> existingMembers = habitChildAllowedMemberMapper.selectList(
                new LambdaQueryWrapper<HabitChildAllowedMember>()
                        .eq(HabitChildAllowedMember::getChildHabitId, childHabitId));
        for (HabitChildAllowedMember existingMember : existingMembers) {
            String nextDelFlag = allowedMemberIds.contains(existingMember.getFamilyMemberId()) ? "0" : "1";
            if (!nextDelFlag.equals(existingMember.getDelFlag())) {
                existingMember.setDelFlag(nextDelFlag);
                existingMember.touchForUpdate(operator);
                habitChildAllowedMemberMapper.updateById(existingMember);
            }
        }
    }

    private void upsertAllowedMembers(Long childHabitId, List<Long> allowedMemberIds, String operator) {
        List<HabitChildAllowedMember> existingMembers = habitChildAllowedMemberMapper.selectList(
                new LambdaQueryWrapper<HabitChildAllowedMember>()
                        .eq(HabitChildAllowedMember::getChildHabitId, childHabitId));
        List<Long> existingMemberIds = existingMembers.stream()
                .map(HabitChildAllowedMember::getFamilyMemberId)
                .toList();
        for (Long familyMemberId : allowedMemberIds) {
            if (existingMemberIds.contains(familyMemberId)) {
                continue;
            }
            HabitChildAllowedMember allowedMember = new HabitChildAllowedMember();
            allowedMember.setChildHabitId(childHabitId);
            allowedMember.setFamilyMemberId(familyMemberId);
            allowedMember.touchForCreate(operator);
            habitChildAllowedMemberMapper.insert(allowedMember);
        }
    }

    private void requireAdminMember(ChildContext context) {
        FamilyGroup family = familyGroupMapper.selectById(context.familyId());
        if (family == null || !context.member().getId().equals(family.getAdminMemberId())) {
            throw new BusinessException("BAD_REQUEST", "Only family admin can manage habit permissions");
        }
    }

    private void requireFamilyMember(Long familyId, Long familyMemberId) {
        Long count = familyMemberMapper.selectCount(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getId, familyMemberId)
                .eq(FamilyMember::getFamilyId, familyId)
                .eq(FamilyMember::getStatus, "active")
                .eq(FamilyMember::getDelFlag, "0"));
        if (count == 0) {
            throw new BusinessException("BAD_REQUEST", "Allowed member is invalid");
        }
    }

    private String generateCustomSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFKD)
                .replaceAll("[^\\p{Alnum}]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            normalized = "custom";
        }
        return normalized + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private record ChildContext(
            UserAccount user,
            ChildProfile child,
            Long familyId,
            FamilyMember member
    ) {
    }
}
