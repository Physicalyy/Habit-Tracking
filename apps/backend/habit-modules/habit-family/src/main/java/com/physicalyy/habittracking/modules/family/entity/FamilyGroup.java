package com.physicalyy.habittracking.modules.family.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("family_group")
public class FamilyGroup extends BaseEntity {

    private String name;

    private Long createdByUserId;

    private Long adminMemberId;

    private String status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public Long getAdminMemberId() {
        return adminMemberId;
    }

    public void setAdminMemberId(Long adminMemberId) {
        this.adminMemberId = adminMemberId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
