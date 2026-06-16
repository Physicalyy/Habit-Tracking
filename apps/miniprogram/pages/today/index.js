const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  checkinHabit,
  listTodayHabits,
} = require("../../services/checkin-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { syncCustomTabBar } = require("../../utils/tab-bar.js");

Page({
  data: {
    loading: true,
    familyName: "",
    childId: "",
    childNickname: "",
    todayHabits: [],
    hasNoHabits: false,
    currentDateText: "",
    completedCount: 0,
    progressPercent: 0,
    progressText: "0%",
    progressHint: "先配置一个习惯，开始今天的成长记录",
    checkingHabitId: "",
    icons: {
      arrowBack: "\ue5e0",
      moreHoriz: "\ue5d3",
      addCircle: "\ue147",
    },
    errorText: "",
  },

  async onShow() {
    syncCustomTabBar(this, 0);
    await this.loadToday();
  },

  async loadToday() {
    this.setData({
      loading: true,
      errorText: "",
      familyName: "",
      childId: "",
      childNickname: "",
      todayHabits: [],
      hasNoHabits: false,
      currentDateText: "",
      completedCount: 0,
      progressPercent: 0,
      progressText: "0%",
      progressHint: "先配置一个习惯，开始今天的成长记录",
      checkingHabitId: "",
    });

    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      if (!bootstrap.defaultChild) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      const childId = bootstrap.defaultChild.id;
      this.setData({
        familyName: bootstrap.defaultFamily ? bootstrap.defaultFamily.name : "",
        childId,
        childNickname: bootstrap.defaultChild.nickname,
      });

      const todayHabits = await listTodayHabits(childId);
      const habitCards = todayHabits.map(toCardState);
      const completedCount = habitCards.filter((item) => item.checked).length;
      const progressPercent = habitCards.length > 0 ? Math.round((completedCount / habitCards.length) * 100) : 0;
      this.setData({
        currentDateText: formatTodayText(),
        completedCount,
        progressPercent,
        progressText: `${progressPercent}%`,
        progressHint: buildProgressHint(habitCards.length, completedCount),
        todayHabits: habitCards,
        hasNoHabits: habitCards.length === 0,
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

  goHabitManage() {
    wx.navigateTo({ url: ROUTES.HABIT_MANAGE });
  },

  async checkinTap(event) {
    const childHabitId = event.currentTarget.dataset.habitId;
    const habit = this.data.todayHabits.find((item) => String(item.childHabitId) === String(childHabitId));
    if (!habit || habit.checked || !habit.canCheckin || this.data.checkingHabitId) {
      return;
    }
    try {
      this.setData({ checkingHabitId: String(childHabitId) });
      await checkinHabit(this.data.childId, childHabitId);
      await this.loadToday();
      wx.showToast({ title: "已打卡", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "打卡失败", icon: "none" });
    } finally {
      this.setData({ checkingHabitId: "" });
    }
  },
});

function toCardState(habit) {
  const checked = Boolean(habit.checked);
  const canCheckin = Boolean(habit.canCheckin);
  const customSource = isCustomSource(habit);
  return {
    ...habit,
    imageUrl: normalizeAssetPath(habit.imageUrl),
    fallbackIcon: iconFallback(habit.iconKey),
    checkedText: checked ? "已打卡" : "待打卡",
    permissionText: canCheckin ? "可打卡" : "无打卡权限",
    permissionClass: canCheckin ? "permission-ok" : "permission-deny",
    habitNameClass: checked ? "habit-name habit-name-checked" : "habit-name",
    showSourceBadge: customSource,
    sourceBadgeText: customSource ? "自定义" : "",
    sourceBadgeClass: customSource ? "source-badge source-badge-custom" : "source-badge",
    showPermissionInlineText: !canCheckin,
    permissionInlineText: canCheckin ? "" : "你无权打卡，可查看记录",
    actionText: checked ? "已打卡" : canCheckin ? "打卡" : "",
    actionIcon: checked ? "\ue86c" : "",
    actionDisabled: checked || !canCheckin,
    actionClass: checked || !canCheckin ? "checkin-action checkin-action-disabled" : "checkin-action",
  };
}

function sourceTypeOf(habit) {
  return String(habit.sourceType || habit.templateSourceType || "").toUpperCase();
}

function isCustomSource(habit) {
  return sourceTypeOf(habit) === "CUSTOM";
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

function formatTodayText() {
  const now = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日${weekdays[now.getDay()]}`;
}

function buildProgressHint(total, completed) {
  if (total === 0) {
    return "先配置一个习惯，开始今天的成长记录";
  }
  const remaining = total - completed;
  if (remaining === 0) {
    return "今天的习惯都完成了，继续保持";
  }
  return `再完成${remaining}个习惯就能完成今日打卡`;
}
