package com.physicalyy.habittracking.modules.family.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

import java.time.LocalDateTime;

@TableName("family_member")
public class FamilyMember extends BaseEntity {

    private Long familyId;

    private Long userId;

    private String displayName;

    private String status;

    private LocalDateTime joinedTime;

    public Long getFamilyId() {
        return familyId;
    }

    public void setFamilyId(Long familyId) {
        this.familyId = familyId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getJoinedTime() {
        return joinedTime;
    }

    public void setJoinedTime(LocalDateTime joinedTime) {
        this.joinedTime = joinedTime;
    }
}
