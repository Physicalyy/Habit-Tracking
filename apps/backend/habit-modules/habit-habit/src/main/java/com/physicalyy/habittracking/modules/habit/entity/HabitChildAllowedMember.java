package com.physicalyy.habittracking.modules.habit.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

@TableName("habit_child_allowed_member")
public class HabitChildAllowedMember extends BaseEntity {

    private Long childHabitId;
    private Long familyMemberId;

    public Long getChildHabitId() {
        return childHabitId;
    }

    public void setChildHabitId(Long childHabitId) {
        this.childHabitId = childHabitId;
    }

    public Long getFamilyMemberId() {
        return familyMemberId;
    }

    public void setFamilyMemberId(Long familyMemberId) {
        this.familyMemberId = familyMemberId;
    }
}
