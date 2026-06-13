const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  getFamilyInvite,
  refreshFamilyInvite,
} = require("../../services/family-service.js");

Page({
  data: {
    familyId: "",
    isFamilyAdmin: false,
    inviteCode: "",
    expiresTime: "",
    loading: false,
    errorText: "",
  },

  async onShow() {
    await this.loadInvite();
  },

  async loadInvite() {
    this.setData({ loading: true, errorText: "" });
    try {
      const bootstrap = await getBootstrap();
      const family = bootstrap.defaultFamily;
      const isFamilyAdmin = Boolean(family && family.admin);
      if (!family || !isFamilyAdmin) {
        this.setData({ familyId: family ? family.id : "", isFamilyAdmin, inviteCode: "", expiresTime: "" });
        return;
      }
      const invite = await getFamilyInvite(family.id);
      this.setData({
        familyId: family.id,
        isFamilyAdmin,
        inviteCode: invite.code,
        expiresTime: invite.expiresTime,
      });
    } catch (error) {
      this.setData({ errorText: error.message || "邀请码加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  copyInviteCode() {
    if (!this.data.inviteCode) {
      return;
    }
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },

  async refreshInvite() {
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可刷新邀请码", icon: "none" });
      return;
    }
    try {
      const invite = await refreshFamilyInvite(this.data.familyId);
      this.setData({
        inviteCode: invite.code,
        expiresTime: invite.expiresTime,
      });
      wx.showToast({ title: "已刷新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "刷新失败", icon: "none" });
    }
  },
});
