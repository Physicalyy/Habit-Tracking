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
import com.physicalyy.habittracking.modules.growthpartner.service.GrowthPartnerService;
import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerChange;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(CheckinService.class);
    private static final long LIST_TODAY_SLOW_THRESHOLD_MS = 1_000L;

    private final CurrentUserService currentUserService;
    private final ChildProfileMapper childProfileMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final HabitChildConfigMapper habitChildConfigMapper;
    private final HabitChildAllowedMemberMapper habitChildAllowedMemberMapper;
    private final HabitCheckinRecordMapper habitCheckinRecordMapper;
    private final GrowthPartnerService growthPartnerService;

    public CheckinService(
            CurrentUserService currentUserService,
            ChildProfileMapper childProfileMapper,
            FamilyMemberMapper familyMemberMapper,
            HabitChildConfigMapper habitChildConfigMapper,
            HabitChildAllowedMemberMapper habitChildAllowedMemberMapper,
            HabitCheckinRecordMapper habitCheckinRecordMapper,
            GrowthPartnerService growthPartnerService
    ) {
        this.currentUserService = currentUserService;
        this.childProfileMapper = childProfileMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.habitChildConfigMapper = habitChildConfigMapper;
        this.habitChildAllowedMemberMapper = habitChildAllowedMemberMapper;
        this.habitCheckinRecordMapper = habitCheckinRecordMapper;
        this.growthPartnerService = growthPartnerService;
    }

    public List<TodayHabitSummary> listTodayHabits(Long childId) {
        long startedAt = System.nanoTime();
        ChildContext context = requireChildContext(childId);
        long contextLoadedAt = System.nanoTime();

        List<HabitChildConfig> childHabits = habitChildConfigMapper.selectList(new LambdaQueryWrapper<HabitChildConfig>()
                .eq(HabitChildConfig::getFamilyId, context.familyId())
                .eq(HabitChildConfig::getChildId, childId)
                .eq(HabitChildConfig::getStatus, "active")
                .eq(HabitChildConfig::getDelFlag, "0")
                .orderByAsc(HabitChildConfig::getSortOrder)
                .orderByAsc(HabitChildConfig::getCreateTime));
        long childHabitsLoadedAt = System.nanoTime();
        if (childHabits.isEmpty()) {
            logSlowListToday(startedAt, contextLoadedAt, childHabitsLoadedAt, childHabitsLoadedAt, childHabitsLoadedAt, 0, 0);
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
        long todayRecordsLoadedAt = System.nanoTime();

        List<TodayHabitSummary> summaries = childHabits.stream()
                .map(childHabit -> toSummary(childHabit, todayRecords.get(childHabit.getId()), context.member()))
                .toList();
        long completedAt = System.nanoTime();
        logSlowListToday(
                startedAt,
                contextLoadedAt,
                childHabitsLoadedAt,
                todayRecordsLoadedAt,
                completedAt,
                childHabits.size(),
                todayRecords.size()
        );
        return summaries;
    }

    public List<CheckinHistoryItem> listHistory(Long childId) {
        ChildContext context = requireChildContext(childId);
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

        Map<Long, Integer> growthDeltas = growthPartnerService.growthDeltasByCheckinIds(records.stream()
                .map(HabitCheckinRecord::getId)
                .toList());

        return records.stream()
                .map(record -> toHistoryItem(record, childHabits.get(record.getChildHabitId()), growthDeltas.get(record.getId())))
                .toList();
    }

    public CheckinSummary getSummary(Long childId) {
        ChildContext context = requireChildContext(childId);
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
    public TodayHabitSummary checkin(Long childId, Long childHabitId) {
        ChildContext context = requireChildContext(childId);
        HabitChildConfig childHabit = requireActiveChildHabit(context, childHabitId);
        if (!canCheckin(childHabit, context.member())) {
            throw new BusinessException("BAD_REQUEST", "Current member cannot check in this habit");
        }

        HabitCheckinRecord existingRecord = findAnyTodayRecord(context, childHabitId);
        if (existingRecord != null && "0".equals(existingRecord.getDelFlag())) {
            throw new BusinessException("BAD_REQUEST", "Habit already checked in today");
        }
        if (existingRecord != null) {
            existingRecord.setDelFlag("0");
            existingRecord.setCheckedByMemberId(context.member().getId());
            existingRecord.setCheckedTime(now());
            existingRecord.setNote("");
            existingRecord.touchForUpdate(context.user().getOpenid());
            habitCheckinRecordMapper.updateById(existingRecord);
            GrowthPartnerChange growthPartnerChange = growthPartnerService.recordCheckinGrowth(
                    context.familyId(),
                    childId,
                    existingRecord.getId(),
                    context.user().getOpenid()
            );
            return toSummary(childHabit, existingRecord, context.member(), growthPartnerChange);
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

        GrowthPartnerChange growthPartnerChange = growthPartnerService.recordCheckinGrowth(
                context.familyId(),
                childId,
                record.getId(),
                context.user().getOpenid()
        );
        return toSummary(childHabit, record, context.member(), growthPartnerChange);
    }

    @Transactional
    public TodayHabitSummary undoTodayCheckin(Long childId, Long childHabitId) {
        ChildContext context = requireChildContext(childId);
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

        GrowthPartnerChange growthPartnerChange = growthPartnerService.undoCheckinGrowth(
                context.familyId(),
                childId,
                existingRecord.getId(),
                context.user().getOpenid()
        );
        return toSummary(childHabit, null, context.member(), growthPartnerChange);
    }

    private ChildContext requireChildContext(Long childId) {
        UserAccount user = currentUserService.requireCurrentUser();
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
        return findAnyTodayRecord(context, childHabitId, "0");
    }

    private HabitCheckinRecord findAnyTodayRecord(ChildContext context, Long childHabitId) {
        return findAnyTodayRecord(context, childHabitId, null);
    }

    private HabitCheckinRecord findAnyTodayRecord(ChildContext context, Long childHabitId, String delFlag) {
        LambdaQueryWrapper<HabitCheckinRecord> query = new LambdaQueryWrapper<HabitCheckinRecord>()
                .eq(HabitCheckinRecord::getFamilyId, context.familyId())
                .eq(HabitCheckinRecord::getChildId, context.child().getId())
                .eq(HabitCheckinRecord::getChildHabitId, childHabitId)
                .eq(HabitCheckinRecord::getCheckinDate, today());
        if (delFlag != null) {
            query.eq(HabitCheckinRecord::getDelFlag, delFlag);
        }
        return habitCheckinRecordMapper.selectOne(query.last("limit 1"));
    }

    private TodayHabitSummary toSummary(HabitChildConfig childHabit, HabitCheckinRecord record, FamilyMember member) {
        return toSummary(childHabit, record, member, null);
    }

    private TodayHabitSummary toSummary(
            HabitChildConfig childHabit,
            HabitCheckinRecord record,
            FamilyMember member,
            GrowthPartnerChange growthPartnerChange
    ) {
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
                record == null ? null : record.getCheckedTime(),
                growthPartnerChange
        );
    }

    private CheckinHistoryItem toHistoryItem(
            HabitCheckinRecord record,
            HabitChildConfig childHabit,
            Integer growthPartnerDelta
    ) {
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
                record.getNote(),
                growthPartnerDelta
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

    private void logSlowListToday(
            long startedAt,
            long contextLoadedAt,
            long childHabitsLoadedAt,
            long todayRecordsLoadedAt,
            long completedAt,
            int habitCount,
            int checkedCount
    ) {
        long totalMs = elapsedMs(startedAt, completedAt);
        if (totalMs < LIST_TODAY_SLOW_THRESHOLD_MS) {
            return;
        }

        log.warn(
                "Slow today habit list detected: totalMs={}, contextMs={}, habitQueryMs={}, checkinQueryMs={}, assembleMs={}, habitCount={}, checkedCount={}",
                totalMs,
                elapsedMs(startedAt, contextLoadedAt),
                elapsedMs(contextLoadedAt, childHabitsLoadedAt),
                elapsedMs(childHabitsLoadedAt, todayRecordsLoadedAt),
                elapsedMs(todayRecordsLoadedAt, completedAt),
                habitCount,
                checkedCount
        );
    }

    private long elapsedMs(long startNanos, long endNanos) {
        return (endNanos - startNanos) / 1_000_000L;
    }

    private record ChildContext(
            UserAccount user,
            ChildProfile child,
            Long familyId,
            FamilyMember member
    ) {
    }
}
