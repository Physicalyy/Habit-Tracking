package com.physicalyy.habittracking.modules.checkin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

@TableName("habit_checkin_record")
public class HabitCheckinRecord extends BaseEntity {

    private Long familyId;
    private Long childId;
    private Long childHabitId;
    private LocalDate checkinDate;
    private Long checkedByMemberId;
    private LocalDateTime checkedTime;
    private String note;

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

    public Long getChildHabitId() {
        return childHabitId;
    }

    public void setChildHabitId(Long childHabitId) {
        this.childHabitId = childHabitId;
    }

    public LocalDate getCheckinDate() {
        return checkinDate;
    }

    public void setCheckinDate(LocalDate checkinDate) {
        this.checkinDate = checkinDate;
    }

    public Long getCheckedByMemberId() {
        return checkedByMemberId;
    }

    public void setCheckedByMemberId(Long checkedByMemberId) {
        this.checkedByMemberId = checkedByMemberId;
    }

    public LocalDateTime getCheckedTime() {
        return checkedTime;
    }

    public void setCheckedTime(LocalDateTime checkedTime) {
        this.checkedTime = checkedTime;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
