const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");

Page({
  data: {
    nickname: "新手家长",
    avatarText: "新",
    familyName: "未加入家庭",
    hasFamily: false,
    isFamilyAdmin: false,
  },

  async onShow() {
    const bootstrap = await getBootstrap();
    const nickname = bootstrap.user.nickname || "新手家长";
    const family = bootstrap.defaultFamily;
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      familyName: family ? family.name : "未加入家庭",
      hasFamily: Boolean(family),
      isFamilyAdmin: Boolean(family && family.admin),
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
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可管理邀请", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_INVITE });
  },

  goHabitLibrary() {
    wx.navigateTo({ url: ROUTES.HABIT_LIBRARY });
  },

  goHabitManage() {
    wx.navigateTo({ url: ROUTES.HABIT_MANAGE });
  },
});
