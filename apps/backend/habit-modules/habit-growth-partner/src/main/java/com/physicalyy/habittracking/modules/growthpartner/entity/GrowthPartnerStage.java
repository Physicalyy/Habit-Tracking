package com.physicalyy.habittracking.modules.growthpartner.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("growth_partner_stage")
public class GrowthPartnerStage extends BaseEntity {

    private Long templateId;
    private String stageCode;
    private String name;
    private Integer requiredGrowthPoints;
    private String imageUrl;
    private String previewImageUrl;
    private Integer sortOrder;
    private String status;

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getStageCode() {
        return stageCode;
    }

    public void setStageCode(String stageCode) {
        this.stageCode = stageCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getRequiredGrowthPoints() {
        return requiredGrowthPoints;
    }

    public void setRequiredGrowthPoints(Integer requiredGrowthPoints) {
        this.requiredGrowthPoints = requiredGrowthPoints;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getPreviewImageUrl() {
        return previewImageUrl;
    }

    public void setPreviewImageUrl(String previewImageUrl) {
        this.previewImageUrl = previewImageUrl;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
