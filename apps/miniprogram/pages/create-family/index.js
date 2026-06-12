const { ROUTES } = require("../../core/routes.js");
const { createFamily } = require("../../services/family-service.js");

Page({
  data: {
    familyName: "",
    childNickname: "",
    submitting: false,
    errorMessage: ""
  },

  onFamilyNameInput(event) {
    this.setData({ familyName: event.detail.value, errorMessage: "" });
  },

  onChildNicknameInput(event) {
    this.setData({ childNickname: event.detail.value, errorMessage: "" });
  },

  async submitCreateFamily() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true, errorMessage: "" });

    try {
      await createFamily({
        familyName: this.data.familyName,
        childNickname: this.data.childNickname
      });
      wx.switchTab({ url: ROUTES.TODAY });
    } catch (error) {
      this.setData({ errorMessage: error.message || "创建家庭失败" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
