const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");

Page({
  data: {
    loading: true,
    familyName: "",
    childNickname: ""
  },

  async onShow() {
    await this.loadToday();
  },

  async loadToday() {
    this.setData({ loading: true });

    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      this.setData({
        familyName: bootstrap.defaultFamily.name,
        childNickname: bootstrap.defaultChild.nickname
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
