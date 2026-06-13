const { getBootstrap } = require("../../services/bootstrap-service.js");
const { createCustomHabit } = require("../../services/child-habit-service.js");

Page({
  data: {
    childId: "",
    habitName: "",
    description: "",
    iconKey: "assignment",
    submitting: false,
    errorText: "",
  },

  async onLoad() {
    const bootstrap = await getBootstrap();
    this.setData({
      childId: bootstrap.defaultChild ? bootstrap.defaultChild.id : "",
    });
  },

  onNameInput(event) {
    this.setData({ habitName: event.detail.value, errorText: "" });
  },

  onDescriptionInput(event) {
    this.setData({ description: event.detail.value, errorText: "" });
  },

  onIconInput(event) {
    this.setData({ iconKey: event.detail.value, errorText: "" });
  },

  async submitCustomHabit() {
    if (this.data.submitting) {
      return;
    }
    if (!this.data.childId) {
      this.setData({ errorText: "请先加入家庭" });
      return;
    }

    this.setData({ submitting: true, errorText: "" });
    try {
      await createCustomHabit({
        childId: this.data.childId,
        name: this.data.habitName,
        description: this.data.description,
        category: "CUSTOM",
        iconKey: this.data.iconKey,
      });
      wx.navigateBack();
    } catch (error) {
      this.setData({ errorText: error.message || "创建失败" });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
