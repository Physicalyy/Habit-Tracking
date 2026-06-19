const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  checkinHabit,
  listTodayHabits,
  undoCheckinHabit,
} = require("../../services/checkin-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { defaultFeedbackState, showInlineFeedback } = require("../../utils/inline-feedback.js");
const { buildNavState } = require("../../utils/navigation-bar.js");
const { syncCustomTabBar } = require("../../utils/tab-bar.js");
const {
  shouldPromptProfile,
  buildAvatarImageUrl,
} = require("../../services/profile-service.js");

const CHECKIN_SUCCESS_ANIMATION_MS = 720;
const CHECKIN_LEAVING_DELAY_MS = 460;

Page({
  data: {
    loading: true,
    nickname: "微信用户",
    avatarText: "微",
    avatarImageUrl: "",
    profileDialogVisible: false,
    familyName: "",
    childId: "",
    childNickname: "",
    todayHabits: [],
    uncheckedHabits: [],
    checkedHabits: [],
    checkedHabitsExpanded: false,
    showCheckedSection: false,
    checkedSectionTitle: "",
    checkedSectionHint: "",
    checkedSectionToggleText: "展开",
    checkedSectionIcon: "\ue5cf",
    checkedSectionClass: "checked-section checked-section-collapsed",
    hasNoHabits: false,
    currentDateText: "",
    completedCount: 0,
    progressPercent: 0,
    progressText: "0%",
    progressRingStyle: "",
    progressHint: "先配置一个习惯，开始今天的成长记录",
    checkingHabitId: "",
    undoingHabitId: "",
    animatingHabitId: "",
    checkinVisualState: "",
    icons: {
      addCircle: "\ue147",
    },
    errorText: "",
    ...defaultFeedbackState,
    ...buildNavState({ title: "今日打卡" }),
  },

  async onShow() {
    syncCustomTabBar(this, 0);
    await this.loadToday();
  },

  async loadToday() {
    this.setData({
      loading: true,
      errorText: "",
      nickname: "微信用户",
      avatarText: "微",
      avatarImageUrl: "",
      profileDialogVisible: false,
      familyName: "",
      childId: "",
      childNickname: "",
      todayHabits: [],
      uncheckedHabits: [],
      checkedHabits: [],
      checkedHabitsExpanded: false,
      showCheckedSection: false,
      checkedSectionTitle: "",
      checkedSectionHint: "",
      checkedSectionToggleText: "展开",
      checkedSectionIcon: "\ue5cf",
      checkedSectionClass: "checked-section checked-section-collapsed",
      hasNoHabits: false,
      currentDateText: "",
      completedCount: 0,
      progressPercent: 0,
      progressText: "0%",
      progressRingStyle: buildProgressRingStyle(0),
      progressHint: "先配置一个习惯，开始今天的成长记录",
      checkingHabitId: "",
      undoingHabitId: "",
      animatingHabitId: "",
      checkinVisualState: "",
      ...defaultFeedbackState,
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

      const currentUser = bootstrap.currentUser || {};
      const nickname = currentUser.nickname || "微信用户";
      const avatarImageUrl = buildAvatarImageUrl(currentUser.avatarUrl);
      const childId = bootstrap.defaultChild.id;
      this.setData({
        nickname,
        avatarText: nickname.slice(0, 1),
        avatarImageUrl,
        profileDialogVisible: shouldPromptProfile(currentUser),
        familyName: bootstrap.defaultFamily ? bootstrap.defaultFamily.name : "",
        childId,
        childNickname: bootstrap.defaultChild.nickname,
      });

      const todayHabits = await listTodayHabits(childId);
      const habitCards = todayHabits.map(toCardState);
      this.setData({
        navTitle: `${bootstrap.defaultChild.nickname}今日打卡`,
        currentDateText: formatTodayText(),
        todayHabits: habitCards,
        ...buildTodayDisplayState(habitCards, false),
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

  onProfileSaved(event) {
    const user = event.detail.user || {};
    const nickname = user.nickname || this.data.nickname;
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      avatarImageUrl: buildAvatarImageUrl(user.avatarUrl),
      profileDialogVisible: false,
    });
    showInlineFeedback(this, "资料已更新", "success");
  },

  onProfileSkipped() {
    this.setData({ profileDialogVisible: false });
  },

  toggleCheckedHabits() {
    if (!this.data.showCheckedSection) {
      return;
    }
    const nextExpanded = !this.data.checkedHabitsExpanded;
    this.setData(buildCheckedSectionState(this.data.checkedHabits, nextExpanded));
  },

  async checkinTap(event) {
    const childHabitId = event.currentTarget.dataset.habitId;
    const habit = this.data.todayHabits.find((item) => String(item.childHabitId) === String(childHabitId));
    if (!habit || habit.checked || !habit.canCheckin || this.data.checkingHabitId || this.data.undoingHabitId) {
      return;
    }
    const habitIdText = String(childHabitId);
    try {
      this.setData({
        checkingHabitId: habitIdText,
        ...buildCheckinAnimationState(this.data.todayHabits, habitIdText, "checking", this.data.checkedHabitsExpanded),
      });
      const checkedHabit = await checkinHabit(this.data.childId, childHabitId);
      this.setData(buildCheckinAnimationState(this.data.todayHabits, habitIdText, "success", this.data.checkedHabitsExpanded));
      setTimeout(() => {
        if (this.data.animatingHabitId === habitIdText && this.data.checkinVisualState === "success") {
          this.setData(buildCheckinAnimationState(this.data.todayHabits, habitIdText, "leaving", this.data.checkedHabitsExpanded));
        }
      }, CHECKIN_LEAVING_DELAY_MS);
      await wait(CHECKIN_SUCCESS_ANIMATION_MS);
      const nextHabitCards = replaceHabitCard(this.data.todayHabits, childHabitId, checkedHabit);
      this.setData({
        todayHabits: nextHabitCards,
        checkingHabitId: "",
        animatingHabitId: "",
        checkinVisualState: "",
        ...buildTodayDisplayState(nextHabitCards, this.data.checkedHabitsExpanded),
      });
    } catch (error) {
      this.setData({
        animatingHabitId: "",
        checkinVisualState: "",
        ...buildAnimatedHabitCards(this.data.todayHabits, "", "", this.data.checkedHabitsExpanded),
      });
      showInlineFeedback(this, error.message || "打卡失败", "error");
    } finally {
      this.setData({ checkingHabitId: "" });
    }
  },

  async undoCheckinTap(event) {
    const childHabitId = event.currentTarget.dataset.habitId;
    const habit = this.data.todayHabits.find((item) => String(item.childHabitId) === String(childHabitId));
    if (!habit || !habit.checked || !habit.canCheckin || this.data.checkingHabitId || this.data.undoingHabitId) {
      return;
    }
    try {
      this.setData({ undoingHabitId: String(childHabitId) });
      const uncheckedHabit = await undoCheckinHabit(this.data.childId, childHabitId);
      const nextHabitCards = replaceHabitCard(this.data.todayHabits, childHabitId, uncheckedHabit);
      this.setData({
        todayHabits: nextHabitCards,
        ...buildTodayDisplayState(nextHabitCards, this.data.checkedHabitsExpanded),
      });
    } catch (error) {
      showInlineFeedback(this, error.message || "撤销失败", "error");
    } finally {
      this.setData({ undoingHabitId: "" });
    }
  },
});

function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function replaceHabitCard(habitCards, childHabitId, updatedHabit) {
  return habitCards.map((habit) => {
    if (String(habit.childHabitId) !== String(childHabitId)) {
      return resetHabitAnimationState(habit);
    }
    return toCardState({
      ...habit,
      ...updatedHabit,
    });
  });
}

function resetHabitAnimationState(habit) {
  return {
    ...habit,
    cardClass: habit.baseCardClass,
    actionClass: habit.baseActionClass,
    actionText: habit.baseActionText,
    actionIcon: habit.baseActionIcon,
    undoActionClass: habit.baseUndoActionClass,
    undoActionText: habit.baseUndoActionText,
    showSuccessBurst: false,
  };
}

function buildTodayDisplayState(habitCards, checkedHabitsExpanded) {
  const completedCount = habitCards.filter((item) => item.checked).length;
  const progressPercent = habitCards.length > 0 ? Math.round((completedCount / habitCards.length) * 100) : 0;
  return {
    completedCount,
    progressPercent,
    progressText: `${progressPercent}%`,
    progressRingStyle: buildProgressRingStyle(progressPercent),
    progressHint: buildProgressHint(habitCards.length, completedCount),
    ...buildHabitGroups(habitCards, checkedHabitsExpanded),
    hasNoHabits: habitCards.length === 0,
  };
}

function buildCheckinAnimationState(habitCards, animatingHabitId, checkinVisualState, checkedHabitsExpanded) {
  return {
    animatingHabitId,
    checkinVisualState,
    ...buildAnimatedHabitCards(habitCards, animatingHabitId, checkinVisualState, checkedHabitsExpanded),
  };
}

function buildAnimatedHabitCards(habitCards, animatingHabitId, checkinVisualState, checkedHabitsExpanded) {
  return buildHabitGroups(
    habitCards.map((habit) => applyCheckinAnimationState(habit, animatingHabitId, checkinVisualState)),
    checkedHabitsExpanded,
  );
}

function applyCheckinAnimationState(habit, animatingHabitId, checkinVisualState) {
  if (String(habit.childHabitId) !== String(animatingHabitId)) {
    return {
      ...habit,
      cardClass: habit.baseCardClass,
      actionClass: habit.baseActionClass,
      actionText: habit.baseActionText,
      actionIcon: habit.baseActionIcon,
      undoActionClass: habit.baseUndoActionClass,
      undoActionText: habit.baseUndoActionText,
      showSuccessBurst: false,
    };
  }

  const cardClassMap = {
    checking: "today-habit-card card checkin-card-checking",
    success: "today-habit-card card checkin-card-success",
    leaving: "today-habit-card card checkin-card-success checkin-card-leaving",
  };
  const actionClassMap = {
    checking: "checkin-action checkin-action-checking",
    success: "checkin-action checkin-action-success",
    leaving: "checkin-action checkin-action-success",
  };

  return {
    ...habit,
    cardClass: cardClassMap[checkinVisualState] || habit.baseCardClass,
    actionClass: actionClassMap[checkinVisualState] || habit.baseActionClass,
    actionText: checkinVisualState === "checking" ? "打卡中" : checkinVisualState ? "已打卡" : habit.baseActionText,
    actionIcon: checkinVisualState === "checking" ? "" : checkinVisualState ? "\ue86c" : habit.baseActionIcon,
    showSuccessBurst: checkinVisualState === "success" || checkinVisualState === "leaving",
  };
}

function buildHabitGroups(habitCards, checkedHabitsExpanded) {
  const uncheckedHabits = habitCards.filter((item) => !item.checked);
  const checkedHabits = habitCards.filter((item) => item.checked);
  return {
    uncheckedHabits,
    checkedHabits,
    ...buildCheckedSectionState(checkedHabits, checkedHabitsExpanded),
  };
}

function buildCheckedSectionState(checkedHabits, checkedHabitsExpanded) {
  const checkedCount = checkedHabits.length;
  return {
    checkedHabitsExpanded,
    showCheckedSection: checkedCount > 0,
    checkedSectionTitle: `已完成 ${checkedCount} 项`,
    checkedSectionHint: checkedHabitsExpanded ? "点击收起已打卡习惯" : "已打卡习惯已收起",
    checkedSectionToggleText: checkedHabitsExpanded ? "收起" : "展开",
    checkedSectionIcon: checkedHabitsExpanded ? "\ue5ce" : "\ue5cf",
    checkedSectionClass: checkedHabitsExpanded ? "checked-section checked-section-expanded" : "checked-section checked-section-collapsed",
  };
}

function toCardState(habit) {
  const checked = Boolean(habit.checked);
  const canCheckin = Boolean(habit.canCheckin);
  const customSource = isCustomSource(habit);
  return {
    ...habit,
    imageUrl: normalizeAssetPath(habit.imageUrl),
    fallbackIcon: iconFallback(habit.iconKey),
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
    baseCardClass: "today-habit-card card",
    cardClass: "today-habit-card card",
    baseActionClass: checked || !canCheckin ? "checkin-action checkin-action-disabled" : "checkin-action",
    baseActionText: checked ? "已打卡" : canCheckin ? "打卡" : "",
    baseActionIcon: checked ? "\ue86c" : "",
    undoActionClass: canCheckin ? "undo-checkin-action" : "undo-checkin-action checkin-action-disabled",
    undoActionText: "撤销",
    baseUndoActionClass: canCheckin ? "undo-checkin-action" : "undo-checkin-action checkin-action-disabled",
    baseUndoActionText: "撤销",
    showSuccessBurst: false,
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

function buildProgressRingStyle(progressPercent) {
  const percent = Math.max(0, Math.min(100, Number(progressPercent || 0)));
  return `background: radial-gradient(circle, #ffffff 0 57%, transparent 58%), conic-gradient(#006b58 0%, #006b58 ${percent}%, #f2f4f2 ${percent}%, #f2f4f2 100%);`;
}
