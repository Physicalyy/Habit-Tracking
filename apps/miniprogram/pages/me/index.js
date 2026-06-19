const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const { getCheckinSummary } = require("../../services/checkin-service.js");
const {
  shouldPromptProfile,
  buildAvatarImageUrl,
} = require("../../services/profile-service.js");
const { defaultFeedbackState, showInlineFeedback } = require("../../utils/inline-feedback.js");
const { buildNavState } = require("../../utils/navigation-bar.js");
const { syncCustomTabBar } = require("../../utils/tab-bar.js");

const defaultFamilyState = {
  familyName: "未加入家庭",
  childNickname: "未选择孩子",
  growthPointsText: "0",
  growthPointsLabel: "成长积分",
  hasFamily: false,
  isFamilyAdmin: false,
  habitManageEntryClass: "bento-item menu-item-disabled",
  habitLibraryEntryClass: "bento-item menu-item-disabled",
  familyCardClass: "family-members-card card menu-item-disabled",
  roleText: "未加入家庭",
  familyMemberText: "加入家庭后显示成员",
};

Page({
  data: {
    nickname: "新手家长",
    avatarText: "新",
    avatarImageUrl: "",
    avatarImageVisible: false,
    profileDialogVisible: false,
    ...defaultFamilyState,
    icons: {
      checklist: "\ue065",
      libraryBooks: "\ue02f",
      groupAdd: "\uf8eb",
      chevronRight: "\ue5cc",
    },
    ...defaultFeedbackState,
    ...buildNavState({ title: "我的" }),
  },

  async onShow() {
    syncCustomTabBar(this, 2);
    this.setData({
      nickname: "新手家长",
      avatarText: "新",
      avatarImageUrl: "",
      avatarImageVisible: false,
      profileDialogVisible: false,
      ...defaultFamilyState,
      ...defaultFeedbackState,
    });
    const bootstrap = await getBootstrap();
    const currentUser = bootstrap.currentUser || {};
    const nickname = currentUser.nickname || "新手家长";
    const avatarImageUrl = buildAvatarImageUrl(currentUser.avatarUrl);
    const family = bootstrap.defaultFamily;
    const child = bootstrap.defaultChild;
    let totalCheckinCount = 0;
    if (child) {
      try {
        const summary = await getCheckinSummary(child.id);
        totalCheckinCount = Number(summary.totalCheckinCount || 0);
      } catch (error) {
        totalCheckinCount = 0;
      }
    }
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      avatarImageUrl,
      avatarImageVisible: Boolean(avatarImageUrl),
      familyName: family ? family.name : "未加入家庭",
      childNickname: child ? child.nickname : "未选择孩子",
      growthPointsText: totalCheckinCount.toLocaleString("zh-CN"),
      growthPointsLabel: "成长积分",
      hasFamily: Boolean(family),
      isFamilyAdmin: Boolean(family && family.admin),
      habitManageEntryClass: family ? "bento-item" : "bento-item menu-item-disabled",
      habitLibraryEntryClass: family ? "bento-item" : "bento-item menu-item-disabled",
      familyCardClass: family ? "family-members-card card" : "family-members-card card menu-item-disabled",
      roleText: family ? (family.admin ? "主家长" : "成员家长") : "未加入家庭",
      familyMemberText: family ? "进入家庭组管理成员和邀请" : "加入家庭后显示成员",
    });
    if (shouldPromptProfile(currentUser)) {
      this.openProfileDialog();
    }
  },

  openProfileDialog() {
    this.setData({
      profileDialogVisible: true,
    });
  },

  onProfileSaved(event) {
    const user = event.detail.user || {};
    const nickname = user.nickname || this.data.nickname;
    const avatarImageUrl = buildAvatarImageUrl(user.avatarUrl);
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      avatarImageUrl,
      avatarImageVisible: Boolean(avatarImageUrl),
      profileDialogVisible: false,
    });
    showInlineFeedback(this, "资料已更新", "success");
  },

  onProfileSkipped() {
    this.setData({ profileDialogVisible: false });
  },

  goFamilyMembers() {
    if (!this.data.hasFamily) {
      showInlineFeedback(this, "请先加入家庭", "info");
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_MEMBERS });
  },

  goHabitLibrary() {
    if (!this.data.hasFamily) {
      showInlineFeedback(this, "请先加入家庭", "info");
      return;
    }
    wx.navigateTo({ url: ROUTES.HABIT_LIBRARY });
  },

  goHabitManage() {
    if (!this.data.hasFamily) {
      showInlineFeedback(this, "请先加入家庭", "info");
      return;
    }
    wx.navigateTo({ url: ROUTES.HABIT_MANAGE });
  },
});
