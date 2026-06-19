const {
  uploadAvatar,
  updateProfile,
  skipProfilePrompt,
  buildAvatarImageUrl,
} = require("../../services/profile-service.js");

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    nickname: {
      type: String,
      value: "微信用户",
    },
    avatarText: {
      type: String,
      value: "微",
    },
    avatarImageUrl: {
      type: String,
      value: "",
    },
  },

  data: {
    draftNickname: "微信用户",
    draftAvatarUrl: "",
    draftAvatarImageUrl: "",
    draftAvatarImageVisible: false,
    nicknameInputFocus: false,
    saving: false,
    errorText: "",
    saveActionClass: "profile-dialog-action profile-dialog-action-primary",
    skipActionClass: "profile-dialog-action profile-dialog-action-secondary",
  },

  observers: {
    "visible,nickname,avatarImageUrl": function syncDraft(visible, nickname, avatarImageUrl) {
      if (!visible) {
        return;
      }
      const imageUrl = String(avatarImageUrl || "");
      this.setData({
        draftNickname: nickname || "微信用户",
        draftAvatarUrl: "",
        draftAvatarImageUrl: imageUrl,
        draftAvatarImageVisible: Boolean(imageUrl),
        nicknameInputFocus: false,
        saving: false,
        errorText: "",
        saveActionClass: "profile-dialog-action profile-dialog-action-primary",
        skipActionClass: "profile-dialog-action profile-dialog-action-secondary",
      });
      setTimeout(() => {
        if (this.properties.visible) {
          this.setData({ nicknameInputFocus: true });
        }
      }, 180);
    },
  },

  methods: {
    async onChooseAvatar(event) {
      const avatarUrl = event && event.detail ? event.detail.avatarUrl : "";
      if (!avatarUrl || this.data.saving) {
        return;
      }
      this.setSaving(true);
      try {
        const uploadedAvatarUrl = await uploadAvatar(avatarUrl);
        const imageUrl = buildAvatarImageUrl(uploadedAvatarUrl);
        this.setData({
          draftAvatarUrl: uploadedAvatarUrl,
          draftAvatarImageUrl: imageUrl,
          draftAvatarImageVisible: Boolean(imageUrl),
          errorText: "",
        });
      } catch (error) {
        this.setData({ errorText: "头像上传失败，请重试" });
      } finally {
        this.setSaving(false);
      }
    },

    onNicknameInput(event) {
      this.setData({
        draftNickname: event.detail.value,
        nicknameInputFocus: false,
        errorText: "",
      });
    },

    onNicknameBlur() {
      this.setData({ nicknameInputFocus: false });
    },

    async saveProfile() {
      if (this.data.saving) {
        return;
      }
      this.setSaving(true);
      try {
        const user = await updateProfile({
          nickname: this.data.draftNickname,
          avatarUrl: this.data.draftAvatarUrl || undefined,
        });
        this.triggerEvent("saved", { user });
      } catch (error) {
        this.setData({ errorText: "资料保存失败，请重试" });
      } finally {
        this.setSaving(false);
      }
    },

    skipProfile() {
      if (this.data.saving) {
        return;
      }
      skipProfilePrompt();
      this.triggerEvent("skipped");
    },

    setSaving(saving) {
      this.setData({
        saving,
        saveActionClass: saving
          ? "profile-dialog-action profile-dialog-action-primary profile-dialog-action-disabled"
          : "profile-dialog-action profile-dialog-action-primary",
        skipActionClass: saving
          ? "profile-dialog-action profile-dialog-action-secondary profile-dialog-action-disabled"
          : "profile-dialog-action profile-dialog-action-secondary",
      });
    },
  },
});
