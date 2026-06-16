const { ROUTES } = require("../../core/routes.js");
const { createFamily } = require("../../services/family-service.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    familyName: "",
    childNickname: "",
    submitting: false,
    submitClass: "primary-button visual-action",
    errorMessage: "",
    icons: {
      arrowBack: "\ue5c4",
      home: "\ue88a",
      face6: "\uf8da",
      info: "\ue88e",
      addCircle: "\ue147",
      groupAdd: "\ue7fe",
      verified: "\ue8e8",
    },
    ...buildNavState({ title: "创建家庭", showBack: true }),
  },

  goBack() {
    goBackWithFallback(ROUTES.START);
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
    const familyName = String(this.data.familyName || "").trim();
    const childNickname = String(this.data.childNickname || "").trim();
    if (!familyName) {
      this.setData({ errorMessage: "请输入家庭名称" });
      return;
    }
    if (!childNickname) {
      this.setData({ errorMessage: "请输入孩子昵称" });
      return;
    }

    this.setData({ submitting: true, submitClass: "primary-button visual-action action-disabled", errorMessage: "" });

    try {
      await createFamily({
        familyName,
        childNickname
      });
      wx.switchTab({ url: ROUTES.TODAY });
    } catch (error) {
      this.setData({ errorMessage: error.message || "创建家庭失败" });
    } finally {
      this.setData({ submitting: false, submitClass: "primary-button visual-action" });
    }
  }
});
