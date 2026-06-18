package com.physicalyy.habittracking.modules.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.checkin.entity.HabitCheckinRecord;
import com.physicalyy.habittracking.modules.checkin.mapper.HabitCheckinRecordMapper;
import com.physicalyy.habittracking.modules.checkin.vo.CheckinHistoryItem;
import com.physicalyy.habittracking.modules.checkin.vo.CheckinSummary;
import com.physicalyy.habittracking.modules.checkin.vo.TodayHabitSummary;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.habit.entity.HabitChildAllowedMember;
import com.physicalyy.habittracking.modules.habit.entity.HabitChildConfig;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildAllowedMemberMapper;
import com.physicalyy.habittracking.modules.habit.mapper.HabitChildConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CheckinService {

    private final CurrentUserService currentUserService;
    private final ChildProfileMapper childProfileMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final HabitChildConfigMapper habitChildConfigMapper;
    private final HabitChildAllowedMemberMapper habitChildAllowedMemberMapper;
    private final HabitCheckinRecordMapper habitCheckinRecordMapper;

    public CheckinService(
            CurrentUserService currentUserService,
            ChildProfileMapper childProfileMapper,
            FamilyMemberMapper familyMemberMapper,
            HabitChildConfigMapper habitChildConfigMapper,
            HabitChildAllowedMemberMapper habitChildAllowedMemberMapper,
            HabitCheckinRecordMapper habitCheckinRecordMapper
    ) {
        this.currentUserService = currentUserService;
        this.childProfileMapper = childProfileMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.habitChildConfigMapper = habitChildConfigMapper;
        this.habitChildAllowedMemberMapper = habitChildAllowedMemberMapper;
        this.habitCheckinRecordMapper = habitCheckinRecordMapper;
    }

    public List<TodayHabitSummary> listTodayHabits(String openid, String nickname, Long childId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        List<HabitChildConfig> childHabits = habitChildConfigMapper.selectList(new LambdaQueryWrapper<HabitChildConfig>()
                .eq(HabitChildConfig::getFamilyId, context.familyId())
                .eq(HabitChildConfig::getChildId, childId)
                .eq(HabitChildConfig::getStatus, "active")
                .eq(HabitChildConfig::getDelFlag, "0")
                .orderByAsc(HabitChildConfig::getSortOrder)
                .orderByAsc(HabitChildConfig::getCreateTime));
        if (childHabits.isEmpty()) {
            return List.of();
        }

        Map<Long, HabitCheckinRecord> todayRecords = habitCheckinRecordMapper.selectList(
                        new LambdaQueryWrapper<HabitCheckinRecord>()
                                .eq(HabitCheckinRecord::getFamilyId, context.familyId())
                                .eq(HabitCheckinRecord::getChildId, childId)
                                .eq(HabitCheckinRecord::getCheckinDate, today())
                                .eq(HabitCheckinRecord::getDelFlag, "0"))
                .stream()
                .collect(Collectors.toMap(HabitCheckinRecord::getChildHabitId, Function.identity()));

        return childHabits.stream()
                .map(childHabit -> toSummary(childHabit, todayRecords.get(childHabit.getId()), context.member()))
                .toList();
    }

    public List<CheckinHistoryItem> listHistory(String openid, String nickname, Long childId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        List<HabitCheckinRecord> records = habitCheckinRecordMapper.selectList(
                new LambdaQueryWrapper<HabitCheckinRecord>()
                        .eq(HabitCheckinRecord::getFamilyId, context.familyId())
                        .eq(HabitCheckinRecord::getChildId, childId)
                        .eq(HabitCheckinRecord::getDelFlag, "0")
                        .orderByDesc(HabitCheckinRecord::getCheckinDate)
                        .orderByDesc(HabitCheckinRecord::getCheckedTime)
                        .orderByDesc(HabitCheckinRecord::getId));
        if (records.isEmpty()) {
            return List.of();
        }

        Map<Long, HabitChildConfig> childHabits = habitChildConfigMapper.selectList(
                        new LambdaQueryWrapper<HabitChildConfig>()
                                .eq(HabitChildConfig::getFamilyId, context.familyId())
                                .eq(HabitChildConfig::getChildId, childId)
                                .eq(HabitChildConfig::getDelFlag, "0")
                                .in(HabitChildConfig::getId, records.stream()
                                        .map(HabitCheckinRecord::getChildHabitId)
                                        .distinct()
                                        .toList()))
                .stream()
                .collect(Collectors.toMap(HabitChildConfig::getId, Function.identity()));

        return records.stream()
                .map(record -> toHistoryItem(record, childHabits.get(record.getChildHabitId())))
                .toList();
    }

    public CheckinSummary getSummary(String openid, String nickname, Long childId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        List<HabitCheckinRecord> records = habitCheckinRecordMapper.selectList(
                new LambdaQueryWrapper<HabitCheckinRecord>()
                        .eq(HabitCheckinRecord::getFamilyId, context.familyId())
                        .eq(HabitCheckinRecord::getChildId, childId)
                        .eq(HabitCheckinRecord::getDelFlag, "0"));
        long totalCheckinDays = records.stream()
                .map(HabitCheckinRecord::getCheckinDate)
                .distinct()
                .count();
        return new CheckinSummary(childId, records.size(), totalCheckinDays);
    }

    @Transactional
    public TodayHabitSummary checkin(String openid, String nickname, Long childId, Long childHabitId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        HabitChildConfig childHabit = requireActiveChildHabit(context, childHabitId);
        if (!canCheckin(childHabit, context.member())) {
            throw new BusinessException("BAD_REQUEST", "Current member cannot check in this habit");
        }

        HabitCheckinRecord existingRecord = findTodayRecord(context, childHabitId);
        if (existingRecord != null) {
            throw new BusinessException("BAD_REQUEST", "Habit already checked in today");
        }

        HabitCheckinRecord record = new HabitCheckinRecord();
        record.setFamilyId(context.familyId());
        record.setChildId(childId);
        record.setChildHabitId(childHabitId);
        record.setCheckinDate(today());
        record.setCheckedByMemberId(context.member().getId());
        record.setCheckedTime(now());
        record.setNote("");
        record.touchForCreate(context.user().getOpenid());
        habitCheckinRecordMapper.insert(record);

        return toSummary(childHabit, record, context.member());
    }

    @Transactional
    public TodayHabitSummary undoTodayCheckin(String openid, String nickname, Long childId, Long childHabitId) {
        ChildContext context = requireChildContext(openid, nickname, childId);
        HabitChildConfig childHabit = requireActiveChildHabit(context, childHabitId);
        if (!canCheckin(childHabit, context.member())) {
            throw new BusinessException("BAD_REQUEST", "Current member cannot undo this check-in");
        }

        HabitCheckinRecord existingRecord = findTodayRecord(context, childHabitId);
        if (existingRecord == null) {
            throw new BusinessException("BAD_REQUEST", "Habit is not checked in today");
        }
        existingRecord.setDelFlag("1");
        existingRecord.touchForUpdate(context.user().getOpenid());
        habitCheckinRecordMapper.updateById(existingRecord);

        return toSummary(childHabit, null, context.member());
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

    private HabitChildConfig requireActiveChildHabit(ChildContext context, Long childHabitId) {
        HabitChildConfig childHabit = habitChildConfigMapper.selectOne(new LambdaQueryWrapper<HabitChildConfig>()
                .eq(HabitChildConfig::getId, childHabitId)
                .eq(HabitChildConfig::getFamilyId, context.familyId())
                .eq(HabitChildConfig::getChildId, context.child().getId())
                .eq(HabitChildConfig::getStatus, "active")
                .eq(HabitChildConfig::getDelFlag, "0")
                .last("limit 1"));
        if (childHabit == null) {
            throw new BusinessException("BAD_REQUEST", "Child habit not found or disabled");
        }
        return childHabit;
    }

    private HabitCheckinRecord findTodayRecord(ChildContext context, Long childHabitId) {
        return habitCheckinRecordMapper.selectOne(new LambdaQueryWrapper<HabitCheckinRecord>()
                .eq(HabitCheckinRecord::getFamilyId, context.familyId())
                .eq(HabitCheckinRecord::getChildId, context.child().getId())
                .eq(HabitCheckinRecord::getChildHabitId, childHabitId)
                .eq(HabitCheckinRecord::getCheckinDate, today())
                .eq(HabitCheckinRecord::getDelFlag, "0")
                .last("limit 1"));
    }

    private TodayHabitSummary toSummary(HabitChildConfig childHabit, HabitCheckinRecord record, FamilyMember member) {
        return new TodayHabitSummary(
                childHabit.getId(),
                childHabit.getChildId(),
                childHabit.getName(),
                childHabit.getDescription(),
                childHabit.getIconKey(),
                childHabit.getImageUrl(),
                childHabit.getPermissionType(),
                canCheckin(childHabit, member),
                record != null,
                record == null ? null : record.getId(),
                record == null ? null : record.getCheckedByMemberId(),
                record == null ? null : record.getCheckinDate(),
                record == null ? null : record.getCheckedTime()
        );
    }

    private CheckinHistoryItem toHistoryItem(HabitCheckinRecord record, HabitChildConfig childHabit) {
        return new CheckinHistoryItem(
                record.getId(),
                record.getChildId(),
                record.getChildHabitId(),
                childHabit == null ? "已删除习惯" : childHabit.getName(),
                childHabit == null ? "" : childHabit.getDescription(),
                childHabit == null ? "" : childHabit.getIconKey(),
                childHabit == null ? "" : childHabit.getImageUrl(),
                record.getCheckinDate(),
                record.getCheckedTime(),
                record.getCheckedByMemberId(),
                record.getNote()
        );
    }

    private boolean canCheckin(HabitChildConfig childHabit, FamilyMember member) {
        return switch (childHabit.getPermissionType()) {
            case "ALL_PARENTS" -> true;
            case "OWNER_ONLY" -> member.getId().equals(childHabit.getCreatedByMemberId());
            case "SPECIFIC_PARENTS" -> isAllowedSpecificParent(childHabit.getId(), member.getId());
            default -> false;
        };
    }

    private boolean isAllowedSpecificParent(Long childHabitId, Long memberId) {
        Long count = habitChildAllowedMemberMapper.selectCount(new LambdaQueryWrapper<HabitChildAllowedMember>()
                .eq(HabitChildAllowedMember::getChildHabitId, childHabitId)
                .eq(HabitChildAllowedMember::getFamilyMemberId, memberId)
                .eq(HabitChildAllowedMember::getDelFlag, "0"));
        return count > 0;
    }

    private LocalDate today() {
        return LocalDate.now();
    }

    private LocalDateTime now() {
        return LocalDateTime.now();
    }

    private record ChildContext(
            UserAccount user,
            ChildProfile child,
            Long familyId,
            FamilyMember member
    ) {
    }
}
