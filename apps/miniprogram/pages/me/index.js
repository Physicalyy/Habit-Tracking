const { getBootstrap } = require("../../services/bootstrap-service.js");

Page({
  data: {
    nickname: "新手家长",
    avatarText: "新",
    familyName: "未加入家庭"
  },

  async onShow() {
    const bootstrap = await getBootstrap();
    const nickname = bootstrap.user.nickname;
    this.setData({
      nickname,
      avatarText: nickname.slice(0, 1),
      familyName: bootstrap.defaultFamily ? bootstrap.defaultFamily.name : "未加入家庭"
    });
  }
});
