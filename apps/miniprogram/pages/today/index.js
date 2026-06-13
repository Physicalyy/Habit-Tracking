const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  checkinHabit,
  listTodayHabits,
} = require("../../services/checkin-service.js");

Page({
  data: {
    loading: true,
    familyName: "",
    childId: "",
    childNickname: "",
    todayHabits: [],
    errorText: "",
  },

  async onShow() {
    await this.loadToday();
  },

  async loadToday() {
    this.setData({ loading: true, errorText: "" });

    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      const childId = bootstrap.defaultChild.id;
      const todayHabits = await listTodayHabits(childId);
      this.setData({
        familyName: bootstrap.defaultFamily.name,
        childId,
        childNickname: bootstrap.defaultChild.nickname,
        todayHabits: todayHabits.map(toCardState),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "今日习惯加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goHabitLibrary() {
    wx.navigateTo({ url: ROUTES.HABIT_LIBRARY });
  },

  async checkinTap(event) {
    const childHabitId = event.currentTarget.dataset.habitId;
    const habit = this.data.todayHabits.find((item) => String(item.childHabitId) === String(childHabitId));
    if (!habit || habit.checked || !habit.canCheckin) {
      return;
    }
    try {
      await checkinHabit(this.data.childId, childHabitId);
      await this.loadToday();
      wx.showToast({ title: "已打卡", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "打卡失败", icon: "none" });
    }
  },
});

function toCardState(habit) {
  return {
    ...habit,
    fallbackIcon: iconFallback(habit.iconKey),
    checkedText: habit.checked ? "已打卡" : "待打卡",
    permissionText: habit.canCheckin ? "可打卡" : "无打卡权限",
    actionText: habit.checked ? "已完成" : "打卡",
    actionDisabled: habit.checked || !habit.canCheckin,
  };
}

function iconFallback(iconKey) {
  const fallbackMap = {
    water_drop: "水",
    menu_book: "读",
    assignment: "任",
    bed: "床",
    soap: "净",
    dentistry: "牙",
    traffic: "灯",
    piano: "琴",
    directions_run: "跑",
  };
  return fallbackMap[iconKey] || "习";
}
