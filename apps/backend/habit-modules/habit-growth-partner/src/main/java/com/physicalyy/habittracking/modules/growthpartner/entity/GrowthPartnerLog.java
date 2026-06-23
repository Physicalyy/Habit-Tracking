package com.physicalyy.habittracking.modules.growthpartner.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("growth_partner_log")
public class GrowthPartnerLog extends BaseEntity {

    private Long familyId;
    private Long childId;
    private Long childGrowthPartnerId;
    private Long templateId;
    private Long checkinRecordId;
    private Integer delta;
    private Integer beforeGrowthPoints;
    private Integer afterGrowthPoints;
    private String beforeStageCode;
    private String afterStageCode;
    private String stageChanged;
    private String animationType;
    private String status;

    public Long getFamilyId() { return familyId; }
    public void setFamilyId(Long familyId) { this.familyId = familyId; }
    public Long getChildId() { return childId; }
    public void setChildId(Long childId) { this.childId = childId; }
    public Long getChildGrowthPartnerId() { return childGrowthPartnerId; }
    public void setChildGrowthPartnerId(Long childGrowthPartnerId) { this.childGrowthPartnerId = childGrowthPartnerId; }
    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }
    public Long getCheckinRecordId() { return checkinRecordId; }
    public void setCheckinRecordId(Long checkinRecordId) { this.checkinRecordId = checkinRecordId; }
    public Integer getDelta() { return delta; }
    public void setDelta(Integer delta) { this.delta = delta; }
    public Integer getBeforeGrowthPoints() { return beforeGrowthPoints; }
    public void setBeforeGrowthPoints(Integer beforeGrowthPoints) { this.beforeGrowthPoints = beforeGrowthPoints; }
    public Integer getAfterGrowthPoints() { return afterGrowthPoints; }
    public void setAfterGrowthPoints(Integer afterGrowthPoints) { this.afterGrowthPoints = afterGrowthPoints; }
    public String getBeforeStageCode() { return beforeStageCode; }
    public void setBeforeStageCode(String beforeStageCode) { this.beforeStageCode = beforeStageCode; }
    public String getAfterStageCode() { return afterStageCode; }
    public void setAfterStageCode(String afterStageCode) { this.afterStageCode = afterStageCode; }
    public String getStageChanged() { return stageChanged; }
    public void setStageChanged(String stageChanged) { this.stageChanged = stageChanged; }
    public String getAnimationType() { return animationType; }
    public void setAnimationType(String animationType) { this.animationType = animationType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
