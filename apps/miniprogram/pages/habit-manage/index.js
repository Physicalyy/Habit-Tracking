const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  listChildHabits,
  updateChildHabitStatus,
} = require("../../services/child-habit-service.js");

Page({
  data: {
    familyId: "",
    childId: "",
    habits: [],
    loading: false,
    errorText: "",
    canManageHabits: false,
  },

  async onShow() {
    await this.loadHabits();
  },

  async loadHabits() {
    this.setData({ loading: true, errorText: "" });
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
        habits: habits.map((habit) => ({
          ...habit,
          statusText: habit.status === "active" ? "已启用" : "已停用",
          toggleText: habit.status === "active" ? "停用" : "启用",
          permissionTypeText: permissionTypeText(habit.permissionType),
          fallbackIcon: iconFallback(habit.iconKey),
        })),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "习惯加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goCustomHabit() {
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可管理习惯", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.CUSTOM_HABIT });
  },

  goHabitPermission(event) {
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可编辑权限", icon: "none" });
      return;
    }
    const habitId = event.currentTarget.dataset.habitId;
    const habitName = event.currentTarget.dataset.habitName;
    const permissionType = event.currentTarget.dataset.permissionType;
    wx.navigateTo({
      url: `${ROUTES.HABIT_PERMISSION}?familyId=${this.data.familyId}&childId=${this.data.childId}&childHabitId=${habitId}&habitName=${encodeURIComponent(habitName)}&permissionType=${permissionType}`,
    });
  },

  async toggleHabitStatus(event) {
    if (!this.data.canManageHabits) {
      wx.showToast({ title: "仅主家长可管理习惯", icon: "none" });
      return;
    }
    const childHabitId = event.currentTarget.dataset.habitId;
    const nextStatus = event.currentTarget.dataset.nextStatus;
    try {
      await updateChildHabitStatus(this.data.childId, childHabitId, nextStatus);
      await this.loadHabits();
    } catch (error) {
      wx.showToast({ title: error.message || "状态更新失败", icon: "none" });
    }
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

function permissionTypeText(permissionType) {
  const textMap = {
    ALL_PARENTS: "所有家长",
    OWNER_ONLY: "创建人",
    SPECIFIC_PARENTS: "指定家长",
  };
  return textMap[permissionType] || permissionType;
}
