const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  listChildHabits,
  updateChildHabitStatus,
} = require("../../services/child-habit-service.js");

Page({
  data: {
    childId: "",
    habits: [],
    loading: false,
    errorText: "",
  },

  async onShow() {
    await this.loadHabits();
  },

  async loadHabits() {
    this.setData({ loading: true, errorText: "" });
    try {
      const bootstrap = await getBootstrap();
      const childId = bootstrap.defaultChild ? bootstrap.defaultChild.id : "";
      if (!childId) {
        this.setData({ childId: "", habits: [] });
        return;
      }
      const habits = await listChildHabits(childId);
      this.setData({
        childId,
        habits: habits.map((habit) => ({
          ...habit,
          statusText: habit.status === "active" ? "已启用" : "已停用",
          toggleText: habit.status === "active" ? "停用" : "启用",
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
    wx.navigateTo({ url: ROUTES.CUSTOM_HABIT });
  },

  async toggleHabitStatus(event) {
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
