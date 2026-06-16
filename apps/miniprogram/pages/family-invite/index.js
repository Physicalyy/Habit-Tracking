const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  getFamilyInvite,
  refreshFamilyInvite,
} = require("../../services/family-service.js");
const { ROUTES } = require("../../core/routes.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");
const { drawInviteQr } = require("../../utils/qr-code.js");

Page({
  data: {
    familyId: "",
    familyName: "",
    childNickname: "",
    isFamilyAdmin: false,
    inviteCode: "",
    qrPayload: "",
    expiresTime: "",
    loading: false,
    refreshing: false,
    refreshActionClass: "refresh-button",
    icons: {
      arrowBack: "\ue5e0",
      family: "\ue63d",
      key: "\ue73c",
      qrCode: "\ue00a",
      share: "\ue80d",
      info: "\ue88e",
      groupAdd: "\ue7f0",
      copy: "\ue14d",
      refresh: "\ue5d5",
    },
    errorText: "",
    ...buildNavState({ title: "邀请家长加入", showBack: true }),
  },

  goBack() {
    goBackWithFallback(ROUTES.FAMILY_MEMBERS);
  },

  async onShow() {
    await this.loadInvite();
  },

  async loadInvite() {
    this.setData({
      loading: true,
      errorText: "",
      familyId: "",
      familyName: "",
      childNickname: "",
      isFamilyAdmin: false,
      inviteCode: "",
      qrPayload: "",
      expiresTime: "",
      refreshing: false,
      refreshActionClass: "refresh-button action-disabled",
    });
    try {
      const bootstrap = await getBootstrap();
      const family = bootstrap.defaultFamily;
      const child = bootstrap.defaultChild;
      const isFamilyAdmin = Boolean(family && family.admin);
      if (!family || !isFamilyAdmin) {
        this.setData({
          familyId: family ? family.id : "",
          familyName: family ? family.name : "",
          childNickname: child ? child.nickname : "",
          isFamilyAdmin,
        });
        return;
      }
      const invite = await getFamilyInvite(family.id);
      const qrPayload = buildInvitePayload(invite.code);
      this.setData({
        familyId: family.id,
        familyName: family.name,
        childNickname: child ? child.nickname : "孩子",
        isFamilyAdmin,
        inviteCode: invite.code,
        qrPayload,
        expiresTime: invite.expiresTime,
        refreshActionClass: "refresh-button",
      });
      this.drawQrCode(qrPayload);
    } catch (error) {
      this.setData({ errorText: error.message || "邀请码加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  copyInviteCode() {
    if (!this.data.inviteCode) {
      wx.showToast({ title: "邀请码未生成", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },

  async refreshInvite() {
    if (this.data.refreshing) {
      return;
    }
    if (!this.data.familyId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可刷新邀请码", icon: "none" });
      return;
    }
    try {
      this.setData({ refreshing: true, refreshActionClass: "refresh-button action-disabled" });
      const invite = await refreshFamilyInvite(this.data.familyId);
      const qrPayload = buildInvitePayload(invite.code);
      this.setData({
        inviteCode: invite.code,
        qrPayload,
        expiresTime: invite.expiresTime,
      });
      this.drawQrCode(qrPayload);
      wx.showToast({ title: "已刷新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "刷新失败", icon: "none" });
    } finally {
      this.setData({ refreshing: false, refreshActionClass: "refresh-button" });
    }
  },

  drawQrCode(payload) {
    drawInviteQr("inviteQr", this, payload);
  },
});

function buildInvitePayload(inviteCode) {
  return `/pages/join-family/index?inviteCode=${encodeURIComponent(inviteCode)}`;
}
