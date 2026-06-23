package com.physicalyy.habittracking.modules.growthpartner.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("growth_partner_template")
public class GrowthPartnerTemplate extends BaseEntity {

    private String templateCode;
    private String name;
    private String description;
    private Integer sortOrder;
    private String status;
    private String defaultAnimationType;

    public String getTemplateCode() {
        return templateCode;
    }

    public void setTemplateCode(String templateCode) {
        this.templateCode = templateCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getDefaultAnimationType() {
        return defaultAnimationType;
    }

    public void setDefaultAnimationType(String defaultAnimationType) {
        this.defaultAnimationType = defaultAnimationType;
    }
}
