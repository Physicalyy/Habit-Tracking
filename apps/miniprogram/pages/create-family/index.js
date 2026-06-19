const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const { createFamily } = require("../../services/family-service.js");
const {
  shouldPromptProfile,
  buildAvatarImageUrl,
} = require("../../services/profile-service.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    familyName: "",
    childNickname: "",
    nickname: "微信用户",
    avatarText: "微",
    avatarImageUrl: "",
    profileDialogVisible: false,
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

  async onLoad() {
    await this.loadProfilePrompt();
  },

  goBack() {
    goBackWithFallback(ROUTES.START);
  },

  async loadProfilePrompt() {
    try {
      const bootstrap = await getBootstrap();
      const currentUser = bootstrap.currentUser || {};
      const nickname = currentUser.nickname || "微信用户";
      const avatarImageUrl = buildAvatarImageUrl(currentUser.avatarUrl);
      this.setData({
        nickname,
        avatarText: nickname.slice(0, 1),
        avatarImageUrl,
        profileDialogVisible: shouldPromptProfile(currentUser),
      });
    } catch (error) {
      this.setData({ profileDialogVisible: false });
    }
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
  },

  onProfileSaved(event) {
    const user = event.detail.user || {};
    const nickname = user.nickname || this.data.nickname;
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      avatarImageUrl: buildAvatarImageUrl(user.avatarUrl),
      profileDialogVisible: false,
    });
  },

  onProfileSkipped() {
    this.setData({ profileDialogVisible: false });
  },
});
