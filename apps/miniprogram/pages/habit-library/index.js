const { listHabitTemplates } = require("../../services/habit-service.js");

const categories = [
  { key: "", label: "全部" },
  { key: "HEALTH", label: "健康" },
  { key: "LIFE_SKILLS", label: "生活" },
  { key: "LEARNING", label: "学习" },
  { key: "SPORTS", label: "运动" },
  { key: "SOCIAL_EMOTION", label: "社交" },
  { key: "SAFETY", label: "安全" },
];

Page({
  data: {
    categories,
    selectedCategory: "",
    searchKeyword: "",
    templates: [],
    loading: false,
    errorText: "",
  },

  onLoad() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true, errorText: "" });
    try {
      const templates = await listHabitTemplates({
        category: this.data.selectedCategory,
        keyword: this.data.searchKeyword,
        sourceType: "SYSTEM",
      });
      this.setData({
        templates: templates.map((template) => ({
          ...template,
          ageText: `${template.ageMin}-${template.ageMax}岁`,
          fallbackIcon: iconFallback(template.iconKey),
        })),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "习惯库加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCategoryTap(event) {
    this.setData({ selectedCategory: event.currentTarget.dataset.category || "" });
    this.loadTemplates();
  },

  onSearchInput(event) {
    this.setData({ searchKeyword: event.detail.value || "" });
    this.loadTemplates();
  },

  onAddTap() {
    wx.showToast({
      title: "下一步开放",
      icon: "none",
    });
  },
});

function iconFallback(iconKey) {
  const fallbackMap = {
    water_drop: "水",
    menu_book: "书",
    assignment: "作",
    bed: "床",
    soap: "洗",
    traffic: "灯",
  };
  return fallbackMap[iconKey] || "习";
}
