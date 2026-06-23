package com.physicalyy.habittracking.modules.growthpartner.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.BusinessException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.service.CurrentUserService;
import com.physicalyy.habittracking.modules.child.entity.ChildProfile;
import com.physicalyy.habittracking.modules.child.mapper.ChildProfileMapper;
import com.physicalyy.habittracking.modules.family.entity.FamilyMember;
import com.physicalyy.habittracking.modules.family.mapper.FamilyMemberMapper;
import com.physicalyy.habittracking.modules.growthpartner.controller.AdoptGrowthPartnerRequest;
import com.physicalyy.habittracking.modules.growthpartner.entity.ChildGrowthPartner;
import com.physicalyy.habittracking.modules.growthpartner.entity.GrowthPartnerLog;
import com.physicalyy.habittracking.modules.growthpartner.entity.GrowthPartnerStage;
import com.physicalyy.habittracking.modules.growthpartner.entity.GrowthPartnerTemplate;
import com.physicalyy.habittracking.modules.growthpartner.mapper.ChildGrowthPartnerMapper;
import com.physicalyy.habittracking.modules.growthpartner.mapper.GrowthPartnerLogMapper;
import com.physicalyy.habittracking.modules.growthpartner.mapper.GrowthPartnerStageMapper;
import com.physicalyy.habittracking.modules.growthpartner.mapper.GrowthPartnerTemplateMapper;
import com.physicalyy.habittracking.modules.growthpartner.vo.ChildGrowthPartnerState;
import com.physicalyy.habittracking.modules.growthpartner.vo.ChildGrowthPartnerSummary;
import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerChange;
import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerStageSummary;
import com.physicalyy.habittracking.modules.growthpartner.vo.GrowthPartnerTemplateSummary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class GrowthPartnerService {

    private static final String ACTIVE = "active";
    private static final String REVERTED = "reverted";

    private final CurrentUserService currentUserService;
    private final ChildProfileMapper childProfileMapper;
    private final FamilyMemberMapper familyMemberMapper;
    private final GrowthPartnerTemplateMapper templateMapper;
    private final GrowthPartnerStageMapper stageMapper;
    private final ChildGrowthPartnerMapper childGrowthPartnerMapper;
    private final GrowthPartnerLogMapper growthPartnerLogMapper;

    public GrowthPartnerService(
            CurrentUserService currentUserService,
            ChildProfileMapper childProfileMapper,
            FamilyMemberMapper familyMemberMapper,
            GrowthPartnerTemplateMapper templateMapper,
            GrowthPartnerStageMapper stageMapper,
            ChildGrowthPartnerMapper childGrowthPartnerMapper,
            GrowthPartnerLogMapper growthPartnerLogMapper
    ) {
        this.currentUserService = currentUserService;
        this.childProfileMapper = childProfileMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.templateMapper = templateMapper;
        this.stageMapper = stageMapper;
        this.childGrowthPartnerMapper = childGrowthPartnerMapper;
        this.growthPartnerLogMapper = growthPartnerLogMapper;
    }

    public List<GrowthPartnerTemplateSummary> listTemplates() {
        List<GrowthPartnerTemplate> templates = templateMapper.selectList(new LambdaQueryWrapper<GrowthPartnerTemplate>()
                .eq(GrowthPartnerTemplate::getStatus, ACTIVE)
                .eq(GrowthPartnerTemplate::getDelFlag, "0")
                .orderByAsc(GrowthPartnerTemplate::getSortOrder)
                .orderByAsc(GrowthPartnerTemplate::getId));
        if (templates.isEmpty()) {
            return List.of();
        }
        Map<Long, List<GrowthPartnerStage>> stagesByTemplate = stagesForTemplateIds(templates.stream()
                .map(GrowthPartnerTemplate::getId)
                .toList());
        return templates.stream()
                .map(template -> toTemplateSummary(template, stagesByTemplate.getOrDefault(template.getId(), List.of())))
                .toList();
    }

    public ChildGrowthPartnerState getCurrentPartner(Long childId) {
        ChildContext context = requireChildContext(childId);
        ChildGrowthPartner partner = findCurrentPartner(context.familyId(), childId);
        return toState(partner);
    }

    @Transactional
    public ChildGrowthPartnerState adopt(Long childId, AdoptGrowthPartnerRequest request) {
        ChildContext context = requireChildContext(childId);
        ChildGrowthPartner existingPartner = findCurrentPartner(context.familyId(), childId);
        if (existingPartner != null) {
            return toState(existingPartner);
        }

        GrowthPartnerTemplate template = templateMapper.selectOne(new LambdaQueryWrapper<GrowthPartnerTemplate>()
                .eq(GrowthPartnerTemplate::getTemplateCode, request.templateCode())
                .eq(GrowthPartnerTemplate::getStatus, ACTIVE)
                .eq(GrowthPartnerTemplate::getDelFlag, "0")
                .last("limit 1"));
        if (template == null) {
            throw new BusinessException("BAD_REQUEST", "Growth partner template not found");
        }

        ChildGrowthPartner partner = new ChildGrowthPartner();
        partner.setFamilyId(context.familyId());
        partner.setChildId(childId);
        partner.setTemplateId(template.getId());
        partner.setNickname(template.getName());
        partner.setGrowthPoints(0);
        partner.setStatus(ACTIVE);
        partner.touchForCreate(context.user().getOpenid());
        childGrowthPartnerMapper.insert(partner);
        return toState(partner);
    }

    @Transactional
    public GrowthPartnerChange recordCheckinGrowth(Long familyId, Long childId, Long checkinRecordId, String operator) {
        ChildGrowthPartner partner = findCurrentPartner(familyId, childId);
        if (partner == null) {
            return null;
        }
        GrowthPartnerLog existingLog = findAnyLog(checkinRecordId);
        if (existingLog != null && ACTIVE.equals(existingLog.getStatus()) && "0".equals(existingLog.getDelFlag())) {
            return null;
        }

        int beforePoints = partner.getGrowthPoints() == null ? 0 : partner.getGrowthPoints();
        int afterPoints = beforePoints + 1;
        List<GrowthPartnerStage> stages = activeStages(partner.getTemplateId());
        GrowthPartnerStage beforeStage = currentStage(stages, beforePoints);
        GrowthPartnerStage afterStage = currentStage(stages, afterPoints);
        boolean stageChanged = !beforeStage.getStageCode().equals(afterStage.getStageCode());
        GrowthPartnerChange change = new GrowthPartnerChange(
                1,
                beforePoints,
                afterPoints,
                beforeStage.getStageCode(),
                afterStage.getStageCode(),
                stageChanged,
                stageChanged ? "stage_upgrade" : "energy_gain"
        );

        partner.setGrowthPoints(afterPoints);
        partner.touchForUpdate(operator);
        childGrowthPartnerMapper.updateById(partner);

        if (existingLog == null) {
            GrowthPartnerLog log = new GrowthPartnerLog();
            fillLog(log, partner, checkinRecordId, change, ACTIVE);
            log.touchForCreate(operator);
            growthPartnerLogMapper.insert(log);
        } else {
            fillLog(existingLog, partner, checkinRecordId, change, ACTIVE);
            existingLog.setDelFlag("0");
            existingLog.touchForUpdate(operator);
            growthPartnerLogMapper.updateById(existingLog);
        }
        return change;
    }

    @Transactional
    public GrowthPartnerChange undoCheckinGrowth(Long familyId, Long childId, Long checkinRecordId, String operator) {
        ChildGrowthPartner partner = findCurrentPartner(familyId, childId);
        if (partner == null) {
            return null;
        }
        GrowthPartnerLog log = growthPartnerLogMapper.selectOne(new LambdaQueryWrapper<GrowthPartnerLog>()
                .eq(GrowthPartnerLog::getCheckinRecordId, checkinRecordId)
                .eq(GrowthPartnerLog::getStatus, ACTIVE)
                .eq(GrowthPartnerLog::getDelFlag, "0")
                .last("limit 1"));
        if (log == null) {
            return null;
        }

        int beforePoints = partner.getGrowthPoints() == null ? 0 : partner.getGrowthPoints();
        int afterPoints = Math.max(0, beforePoints - 1);
        List<GrowthPartnerStage> stages = activeStages(partner.getTemplateId());
        GrowthPartnerStage beforeStage = currentStage(stages, beforePoints);
        GrowthPartnerStage afterStage = currentStage(stages, afterPoints);
        boolean stageChanged = !beforeStage.getStageCode().equals(afterStage.getStageCode());
        GrowthPartnerChange change = new GrowthPartnerChange(
                -1,
                beforePoints,
                afterPoints,
                beforeStage.getStageCode(),
                afterStage.getStageCode(),
                stageChanged,
                stageChanged ? "stage_downgrade" : "energy_gain"
        );

        partner.setGrowthPoints(afterPoints);
        partner.touchForUpdate(operator);
        childGrowthPartnerMapper.updateById(partner);

        fillLog(log, partner, checkinRecordId, change, REVERTED);
        log.touchForUpdate(operator);
        growthPartnerLogMapper.updateById(log);
        return change;
    }

    public Map<Long, Integer> growthDeltasByCheckinIds(List<Long> checkinRecordIds) {
        if (checkinRecordIds == null || checkinRecordIds.isEmpty()) {
            return Map.of();
        }
        return growthPartnerLogMapper.selectList(new LambdaQueryWrapper<GrowthPartnerLog>()
                        .in(GrowthPartnerLog::getCheckinRecordId, checkinRecordIds)
                        .eq(GrowthPartnerLog::getStatus, ACTIVE)
                        .eq(GrowthPartnerLog::getDelFlag, "0"))
                .stream()
                .collect(Collectors.toMap(GrowthPartnerLog::getCheckinRecordId, GrowthPartnerLog::getDelta));
    }

    private ChildContext requireChildContext(Long childId) {
        UserAccount user = currentUserService.requireCurrentUser();
        ChildProfile child = childProfileMapper.selectOne(new LambdaQueryWrapper<ChildProfile>()
                .eq(ChildProfile::getId, childId)
                .eq(ChildProfile::getStatus, ACTIVE)
                .eq(ChildProfile::getDelFlag, "0")
                .last("limit 1"));
        if (child == null) {
            throw new BusinessException("BAD_REQUEST", "Child not found");
        }
        FamilyMember member = familyMemberMapper.selectOne(new LambdaQueryWrapper<FamilyMember>()
                .eq(FamilyMember::getFamilyId, child.getFamilyId())
                .eq(FamilyMember::getUserId, user.getId())
                .eq(FamilyMember::getStatus, ACTIVE)
                .eq(FamilyMember::getDelFlag, "0")
                .last("limit 1"));
        if (member == null) {
            throw new BusinessException("BAD_REQUEST", "Current user is not a family member");
        }
        return new ChildContext(user, child.getFamilyId());
    }

    private GrowthPartnerTemplateSummary toTemplateSummary(GrowthPartnerTemplate template, List<GrowthPartnerStage> stages) {
        return new GrowthPartnerTemplateSummary(
                template.getTemplateCode(),
                template.getName(),
                template.getDescription(),
                template.getDefaultAnimationType(),
                stages.stream().map(stage -> toStageSummary(stage, 0)).toList()
        );
    }

    private ChildGrowthPartnerState toState(ChildGrowthPartner partner) {
        if (partner == null) {
            return new ChildGrowthPartnerState(false, null, null, null, List.of());
        }
        GrowthPartnerTemplate template = templateMapper.selectById(partner.getTemplateId());
        List<GrowthPartnerStage> stages = activeStages(partner.getTemplateId());
        int growthPoints = partner.getGrowthPoints() == null ? 0 : partner.getGrowthPoints();
        GrowthPartnerStage currentStage = currentStage(stages, growthPoints);
        GrowthPartnerStage nextStage = nextStage(stages, growthPoints);
        return new ChildGrowthPartnerState(
                true,
                new ChildGrowthPartnerSummary(
                        partner.getId(),
                        partner.getChildId(),
                        template.getTemplateCode(),
                        template.getName(),
                        partner.getNickname(),
                        growthPoints
                ),
                toStageSummary(currentStage, growthPoints),
                nextStage == null ? null : toStageSummary(nextStage, growthPoints),
                stages.stream().map(stage -> toStageSummary(stage, growthPoints)).toList()
        );
    }

    private ChildGrowthPartner findCurrentPartner(Long familyId, Long childId) {
        return childGrowthPartnerMapper.selectOne(new LambdaQueryWrapper<ChildGrowthPartner>()
                .eq(ChildGrowthPartner::getFamilyId, familyId)
                .eq(ChildGrowthPartner::getChildId, childId)
                .eq(ChildGrowthPartner::getStatus, ACTIVE)
                .eq(ChildGrowthPartner::getDelFlag, "0")
                .last("limit 1"));
    }

    private GrowthPartnerLog findAnyLog(Long checkinRecordId) {
        return growthPartnerLogMapper.selectOne(new LambdaQueryWrapper<GrowthPartnerLog>()
                .eq(GrowthPartnerLog::getCheckinRecordId, checkinRecordId)
                .last("limit 1"));
    }

    private List<GrowthPartnerStage> activeStages(Long templateId) {
        return stageMapper.selectList(new LambdaQueryWrapper<GrowthPartnerStage>()
                .eq(GrowthPartnerStage::getTemplateId, templateId)
                .eq(GrowthPartnerStage::getStatus, ACTIVE)
                .eq(GrowthPartnerStage::getDelFlag, "0")
                .orderByAsc(GrowthPartnerStage::getRequiredGrowthPoints)
                .orderByAsc(GrowthPartnerStage::getSortOrder));
    }

    private Map<Long, List<GrowthPartnerStage>> stagesForTemplateIds(List<Long> templateIds) {
        return stageMapper.selectList(new LambdaQueryWrapper<GrowthPartnerStage>()
                        .in(GrowthPartnerStage::getTemplateId, templateIds)
                        .eq(GrowthPartnerStage::getStatus, ACTIVE)
                        .eq(GrowthPartnerStage::getDelFlag, "0")
                        .orderByAsc(GrowthPartnerStage::getRequiredGrowthPoints)
                        .orderByAsc(GrowthPartnerStage::getSortOrder))
                .stream()
                .collect(Collectors.groupingBy(GrowthPartnerStage::getTemplateId));
    }

    private GrowthPartnerStage currentStage(List<GrowthPartnerStage> stages, int growthPoints) {
        return stages.stream()
                .filter(stage -> stage.getRequiredGrowthPoints() <= growthPoints)
                .max(Comparator.comparing(GrowthPartnerStage::getRequiredGrowthPoints))
                .orElseThrow(() -> new BusinessException("BAD_REQUEST", "Growth partner stage not configured"));
    }

    private GrowthPartnerStage nextStage(List<GrowthPartnerStage> stages, int growthPoints) {
        return stages.stream()
                .filter(stage -> stage.getRequiredGrowthPoints() > growthPoints)
                .min(Comparator.comparing(GrowthPartnerStage::getRequiredGrowthPoints))
                .orElse(null);
    }

    private GrowthPartnerStageSummary toStageSummary(GrowthPartnerStage stage, int growthPoints) {
        return new GrowthPartnerStageSummary(
                stage.getStageCode(),
                stage.getName(),
                stage.getRequiredGrowthPoints(),
                stage.getImageUrl(),
                stage.getPreviewImageUrl(),
                growthPoints >= stage.getRequiredGrowthPoints()
        );
    }

    private void fillLog(
            GrowthPartnerLog log,
            ChildGrowthPartner partner,
            Long checkinRecordId,
            GrowthPartnerChange change,
            String status
    ) {
        log.setFamilyId(partner.getFamilyId());
        log.setChildId(partner.getChildId());
        log.setChildGrowthPartnerId(partner.getId());
        log.setTemplateId(partner.getTemplateId());
        log.setCheckinRecordId(checkinRecordId);
        log.setDelta(change.delta());
        log.setBeforeGrowthPoints(change.beforeGrowthPoints());
        log.setAfterGrowthPoints(change.afterGrowthPoints());
        log.setBeforeStageCode(change.beforeStageCode());
        log.setAfterStageCode(change.afterStageCode());
        log.setStageChanged(change.stageChanged() ? "1" : "0");
        log.setAnimationType(change.animationType());
        log.setStatus(status);
    }

    private record ChildContext(UserAccount user, Long familyId) {
    }
}
