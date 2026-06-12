const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");

Page({
  data: {
    icons: {
      addHome: "\uf8eb",
      bubbleChart: "\ue6dd",
      eco: "\uea35",
      favorite: "\ue87e",
      groupAdd: "\ue7f0"
    },
    loading: false
  },

  async onLoad() {
    await this.loadBootstrap();
  },

  async loadBootstrap() {
    this.setData({ loading: true });

    try {
      const bootstrap = await getBootstrap();
      if (!bootstrap.needOnboarding) {
        wx.switchTab({ url: ROUTES.TODAY });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  goCreateFamily() {
    wx.navigateTo({ url: ROUTES.CREATE_FAMILY });
  },

  goJoinFamily() {
    wx.navigateTo({ url: ROUTES.JOIN_FAMILY });
  }
});
