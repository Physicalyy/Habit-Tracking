const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
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
  familyMembersEntryClass: "bento-item menu-item-disabled",
  inviteEntryClass: "bento-item menu-item-disabled",
  familyAddClass: "family-add menu-item-disabled",
  familyCardClass: "family-members-card card menu-item-disabled",
  roleText: "未加入家庭",
  familyMemberText: "加入家庭后显示成员",
};

Page({
  data: {
    nickname: "新手家长",
    avatarText: "新",
    ...defaultFamilyState,
    icons: {
      arrowBack: "\ue5e0",
      moreHoriz: "\ue5d3",
      edit: "\ue3c9",
      checklist: "\ue065",
      libraryBooks: "\ue02f",
      qrCode: "\ue00a",
      groupAdd: "\uf8eb",
      chevronRight: "\ue5cc",
      settings: "\ue8b8",
      help: "\ue887",
      info: "\ue88e",
    },
  },

  async onShow() {
    syncCustomTabBar(this, 2);
    this.setData({
      nickname: "新手家长",
      avatarText: "新",
      ...defaultFamilyState,
    });
    const bootstrap = await getBootstrap();
    const currentUser = bootstrap.currentUser || {};
    const nickname = currentUser.nickname || "新手家长";
    const family = bootstrap.defaultFamily;
    const child = bootstrap.defaultChild;
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      familyName: family ? family.name : "未加入家庭",
      childNickname: child ? child.nickname : "未选择孩子",
      growthPointsText: buildGrowthPointsText(child),
      growthPointsLabel: "成长积分",
      hasFamily: Boolean(family),
      isFamilyAdmin: Boolean(family && family.admin),
      habitManageEntryClass: family ? "bento-item" : "bento-item menu-item-disabled",
      habitLibraryEntryClass: family ? "bento-item" : "bento-item menu-item-disabled",
      familyMembersEntryClass: family ? "bento-item" : "bento-item menu-item-disabled",
      inviteEntryClass: family && family.admin ? "bento-item" : "bento-item menu-item-disabled",
      familyAddClass: family ? "family-add" : "family-add menu-item-disabled",
      familyCardClass: family ? "family-members-card card" : "family-members-card card menu-item-disabled",
      roleText: family ? (family.admin ? "主家长" : "成员家长") : "未加入家庭",
      familyMemberText: family ? "查看和管理家庭成员" : "加入家庭后显示成员",
    });
  },

  goFamilyMembers() {
    if (!this.data.hasFamily) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_MEMBERS });
  },

  goFamilyInvite() {
    if (!this.data.hasFamily) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可管理邀请", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_INVITE });
  },

  goHabitLibrary() {
    if (!this.data.hasFamily) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.HABIT_LIBRARY });
  },

  goHabitManage() {
    if (!this.data.hasFamily) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.HABIT_MANAGE });
  },
});

function buildGrowthPointsText(child) {
  if (!child) {
    return "0";
  }
  const points = Number(child.growthPoints || child.points || child.score || 0);
  return points.toLocaleString("zh-CN");
}
