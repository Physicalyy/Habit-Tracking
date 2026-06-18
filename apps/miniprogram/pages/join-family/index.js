const { ROUTES } = require("../../core/routes.js");
const { joinFamily } = require("../../services/family-service.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

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
    ...buildNavState({ title: "加入家庭", showBack: true }),
  },

  goBack() {
    goBackWithFallback(ROUTES.START);
  },

  onLoad(options) {
    const inviteCode = parseInviteCode(options && options.inviteCode);
    if (inviteCode) {
      this.setData({ inviteCode });
    }
  },

  onInviteCodeInput(event) {
    this.setData({ inviteCode: event.detail.value, errorMessage: "" });
  },

  scanInviteCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (result) => {
        const inviteCode = parseInviteCode(result.result || result.path || result.scanType || "");
        if (!inviteCode) {
          this.setData({ errorMessage: "未识别到有效邀请码" });
          return;
        }
        this.setData({ inviteCode, errorMessage: "" });
      },
      fail: () => {
      },
    });
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
  },
});

function parseInviteCode(value) {
  const text = decodeURIComponent(String(value || "").trim());
  const directMatch = text.match(/^\d{6}$/);
  if (directMatch) {
    return directMatch[0];
  }
  const paramMatch = text.match(/[?&]inviteCode=(\d{6})/);
  if (paramMatch) {
    return paramMatch[1];
  }
  const pathMatch = text.match(/inviteCode%3D(\d{6})/i);
  return pathMatch ? pathMatch[1] : "";
}
