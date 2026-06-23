package com.physicalyy.habittracking.modules.growthpartner.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("child_growth_partner")
public class ChildGrowthPartner extends BaseEntity {

    private Long familyId;
    private Long childId;
    private Long templateId;
    private String nickname;
    private Integer growthPoints;
    private String status;

    public Long getFamilyId() {
        return familyId;
    }

    public void setFamilyId(Long familyId) {
        this.familyId = familyId;
    }

    public Long getChildId() {
        return childId;
    }

    public void setChildId(Long childId) {
        this.childId = childId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public Integer getGrowthPoints() {
        return growthPoints;
    }

    public void setGrowthPoints(Integer growthPoints) {
        this.growthPoints = growthPoints;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
