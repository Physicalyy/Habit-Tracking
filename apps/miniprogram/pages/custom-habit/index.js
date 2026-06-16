const { getBootstrap } = require("../../services/bootstrap-service.js");
const { createCustomHabit } = require("../../services/child-habit-service.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");
const { ROUTES } = require("../../core/routes.js");

Page({
  data: {
    childId: "",
    habitName: "",
    description: "",
    iconKey: "assignment",
    selectedIconSymbol: "\ue85d",
    category: "LIFE_SKILLS",
    iconOptions: [
      { key: "assignment", label: "任务", symbol: "\ue85d", className: "icon-option icon-option-active" },
      { key: "menu_book", label: "阅读", symbol: "\ue02f", className: "icon-option" },
      { key: "directions_run", label: "运动", symbol: "\ue566", className: "icon-option" },
      { key: "self_improvement", label: "情绪", symbol: "\uea3b", className: "icon-option" },
    ],
    categoryOptions: [
      { key: "HEALTH", label: "健康卫生", className: "category-pill" },
      { key: "LIFE_SKILLS", label: "日常生活", className: "category-pill category-pill-active" },
      { key: "LEARNING", label: "学习成长", className: "category-pill" },
      { key: "SPORTS", label: "运动健康", className: "category-pill" },
      { key: "SOCIAL_EMOTION", label: "社交礼仪", className: "category-pill" },
      { key: "SAFETY", label: "安全教育", className: "category-pill" },
    ],
    submitting: false,
    submitClass: "primary-button visual-action",
    errorText: "",
    icons: {
      arrowBack: "\ue5e0",
      edit: "\ue3c9",
      groups: "\ue7ef",
      chevronRight: "\ue5cc",
      info: "\ue88e",
      add: "\ue145",
    },
    ...buildNavState({ title: "创建自定义习惯", showBack: true }),
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

  chooseIcon(event) {
    const currentKey = this.data.iconKey;
    const currentIndex = this.data.iconOptions.findIndex((item) => item.key === currentKey);
    const nextOption = this.data.iconOptions[(currentIndex + 1) % this.data.iconOptions.length] || this.data.iconOptions[0];
    const iconKey = (event.currentTarget.dataset && event.currentTarget.dataset.key) || nextOption.key;
    this.setData({
      iconKey,
      selectedIconSymbol: (this.data.iconOptions.find((item) => item.key === iconKey) || {}).symbol || "\ue85d",
      iconOptions: this.data.iconOptions.map((item) => ({
        ...item,
        className: item.key === iconKey ? "icon-option icon-option-active" : "icon-option",
      })),
      errorText: "",
    });
  },

  chooseCategory(event) {
    const category = event.currentTarget.dataset.key;
    this.setData({
      category,
      categoryOptions: this.data.categoryOptions.map((item) => ({
        ...item,
        className: item.key === category ? "category-pill category-pill-active" : "category-pill",
      })),
      errorText: "",
    });
  },

  goBack() {
    goBackWithFallback(ROUTES.HABIT_LIBRARY);
  },

  async submitCustomHabit() {
    if (this.data.submitting) {
      return;
    }
    if (!this.data.childId) {
      this.setData({ errorText: "请先加入家庭" });
      return;
    }
    const habitName = String(this.data.habitName || "").trim();
    const description = String(this.data.description || "").trim();
    if (!habitName) {
      this.setData({ errorText: "请输入习惯名称" });
      return;
    }

    this.setData({ submitting: true, submitClass: "primary-button visual-action action-disabled", errorText: "" });
    try {
      await createCustomHabit({
        childId: this.data.childId,
        name: habitName,
        description,
        category: this.data.category,
        iconKey: this.data.iconKey,
      });
      wx.navigateBack();
    } catch (error) {
      this.setData({ errorText: error.message || "创建失败" });
    } finally {
      this.setData({ submitting: false, submitClass: "primary-button visual-action" });
    }
  },
});
