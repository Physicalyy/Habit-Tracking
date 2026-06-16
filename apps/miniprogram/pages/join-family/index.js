const { ROUTES } = require("../../core/routes.js");
const { joinFamily } = require("../../services/family-service.js");

Page({
  data: {
    inviteCode: "",
    submitting: false,
    submitClass: "primary-button visual-action",
    errorMessage: "",
    icons: {
      arrowBack: "\ue5c4",
      familyHistory: "\ue0ad",
      qrCodeScanner: "\uf206",
      info: "\ue88e",
    },
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onInviteCodeInput(event) {
    this.setData({ inviteCode: event.detail.value, errorMessage: "" });
  },

  async submitJoinFamily() {
    if (this.data.submitting) {
      return;
    }
    const inviteCode = String(this.data.inviteCode || "").trim();
    if (!/^\d{6}$/.test(inviteCode)) {
      this.setData({ errorMessage: "请输入 6 位数字邀请码" });
      return;
    }

    this.setData({ submitting: true, submitClass: "primary-button visual-action action-disabled", errorMessage: "" });

    try {
      await joinFamily({ inviteCode });
      wx.switchTab({ url: ROUTES.TODAY });
    } catch (error) {
      this.setData({ errorMessage: error.message || "加入家庭失败" });
    } finally {
      this.setData({ submitting: false, submitClass: "primary-button visual-action" });
    }
  }
});
