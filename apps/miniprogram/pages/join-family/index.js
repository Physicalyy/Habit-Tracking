const { ROUTES } = require("../../core/routes.js");
const { joinFamily } = require("../../services/family-service.js");

Page({
  data: {
    inviteCode: "",
    submitting: false,
    errorMessage: ""
  },

  onInviteCodeInput(event) {
    this.setData({ inviteCode: event.detail.value, errorMessage: "" });
  },

  async submitJoinFamily() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true, errorMessage: "" });

    try {
      await joinFamily({ inviteCode: this.data.inviteCode });
      wx.switchTab({ url: ROUTES.TODAY });
    } catch (error) {
      this.setData({ errorMessage: error.message || "加入家庭失败" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
