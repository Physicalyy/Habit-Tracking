const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  listChildHabits,
  removeChildHabit,
  updateChildHabitStatus,
} = require("../../services/child-habit-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    familyId: "",
    childId: "",
    habits: [],
    hasNoHabits: false,
    loading: false,
    errorText: "",
    canManageHabits: false,
    updatingHabitId: "",
    deletingHabitId: "",
    addActionClass: "add-habit-action action-disabled",
    icons: {
      arrowBack: "\ue5e0",
      add: "\ue145",
      drag: "\ue25d",
      lightbulb: "\ue0f0",
    },
    ...buildNavState({ title: "习惯管理", showBack: true }),
  },

  async onShow() {
    await this.loadHabits();
  },

  async loadHabits() {
    this.setData({
      loading: true,
      errorText: "",
      familyId: "",
      childId: "",
      habits: [],
      hasNoHabits: false,
      canManageHabits: false,
      updatingHabitId: "",
      deletingHabitId: "",
      addActionClass: "add-habit-action action-disabled",
    });
    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding || !bootstrap.defaultChild) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }
      const family = bootstrap.defaultFamily;
      const childId = bootstrap.defaultChild.id;
      const canManageHabits = Boolean(family && family.admin);
      const habits = await listChildHabits(childId);
      this.setData({
        familyId: family ? family.id : "",
        childId,
        canManageHabits,
        addActionClass: canManageHabits ? "add-habit-action" : "add-habit-action action-disabled",
        habits: habits.map((habit) => ({
          ...habit,
          imageUrl: normalizeAssetPath(habit.imageUrl),
          statusText: habit.status === "active" ? "已启用" : "已停用",
          toggleText: habit.status === "active" ? "停用" : "启用",
          permissionTypeText: permissionTypeText(habit.permissionType),
          allowedMemberIdsText: Array.isArray(habit.allowedMemberIds) ? habit.allowedMemberIds.join(",") : "",
          fallbackIcon: iconFallback(habit.iconKey),
          activeClass: habit.status === "active" ? "active" : "disabled",
          showSourceBadge: isCustomSource(habit),
          sourceBadgeText: sourceBadgeText(habit),
          sourceBadgeClass: sourceBadgeClass(habit),
          toggleSwitchClass: buildToggleSwitchClass(habit.status, canManageHabits, this.data.updatingHabitId === String(habit.id)),
          permissionActionClass: canManageHabits ? "permission-action" : "permission-action action-disabled",
          deleteActionClass: canManageHabits ? "delete-swipe-action" : "delete-swipe-action action-disabled",
          nextStatus: habit.status === "active" ? "disabled" : "active",
        })),
        hasNoHabits: habits.length === 0,
      });
    } catch (error) {
      this.setData({ errorText: error.message || "习惯加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goHabitLibrary() {
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可管理习惯", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.HABIT_LIBRARY });
  },

  goBack() {
    goBackWithFallback(ROUTES.ME, true);
  },

  goHabitPermission(event) {
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可编辑权限", icon: "none" });
      return;
    }
    const habitId = event.currentTarget.dataset.habitId;
    const habitName = event.currentTarget.dataset.habitName;
    const permissionType = event.currentTarget.dataset.permissionType;
    const allowedMemberIds = event.currentTarget.dataset.allowedMemberIds || "";
    wx.navigateTo({
      url: `${ROUTES.HABIT_PERMISSION}?familyId=${this.data.familyId}&childId=${this.data.childId}&childHabitId=${habitId}&habitName=${encodeURIComponent(habitName)}&permissionType=${permissionType}&allowedMemberIds=${encodeURIComponent(allowedMemberIds)}`,
    });
  },

  async toggleHabitStatus(event) {
    if (this.data.updatingHabitId) {
      return;
    }
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可管理习惯", icon: "none" });
      return;
    }
    const childHabitId = event.currentTarget.dataset.habitId;
    const nextStatus = event.currentTarget.dataset.nextStatus;
    try {
      this.setData({ updatingHabitId: String(childHabitId) });
      await updateChildHabitStatus(this.data.childId, childHabitId, nextStatus);
      this.setData({ updatingHabitId: "" });
      await this.loadHabits();
    } catch (error) {
      wx.showToast({ title: error.message || "状态更新失败", icon: "none" });
      this.setData({ updatingHabitId: "" });
    }
  },

  async deleteHabitTap(event) {
    if (this.data.deletingHabitId) {
      return;
    }
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可删除习惯", icon: "none" });
      return;
    }
    const childHabitId = event.currentTarget.dataset.habitId;
    wx.showModal({
      title: "删除习惯",
      content: "删除后今日页不再显示，历史打卡记录会保留。",
      confirmText: "删除",
      confirmColor: "#ba1a1a",
      success: async (result) => {
        if (!result.confirm) {
          return;
        }
        try {
          this.setData({ deletingHabitId: String(childHabitId) });
          await removeChildHabit(this.data.childId, childHabitId);
          wx.showToast({ title: "已删除", icon: "success" });
          await this.loadHabits();
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        } finally {
          this.setData({ deletingHabitId: "" });
        }
      },
    });
  },
});

function iconFallback(iconKey) {
  const fallbackMap = {
    water_drop: "水",
    menu_book: "读",
    assignment: "任",
    bed: "床",
    soap: "净",
    traffic: "灯",
    piano: "琴",
    directions_run: "跑",
  };
  return fallbackMap[iconKey] || "习";
}

function buildToggleSwitchClass(status, canManageHabits, updating) {
  const parts = ["toggle-switch", status === "active" ? "active" : "disabled"];
  if (!canManageHabits || updating) {
    parts.push("action-disabled");
  }
  return parts.join(" ");
}

function sourceTypeOf(habit) {
  return String(habit.sourceType || habit.templateSourceType || "").toUpperCase();
}

function isCustomSource(habit) {
  return sourceTypeOf(habit) === "CUSTOM";
}

function sourceBadgeText(habit) {
  return isCustomSource(habit) ? "自定义" : "";
}

function sourceBadgeClass(habit) {
  return isCustomSource(habit) ? "source-badge source-badge-custom" : "source-badge";
}

function permissionTypeText(permissionType) {
  const textMap = {
    ALL_PARENTS: "所有家长",
    OWNER_ONLY: "创建人",
    SPECIFIC_PARENTS: "指定家长",
  };
  return textMap[permissionType] || permissionType;
}
