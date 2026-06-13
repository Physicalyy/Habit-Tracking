const { addSystemTemplateToChild } = require("../../services/child-habit-service.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
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
    childId: "",
    templates: [],
    loading: false,
    addingSlug: "",
    errorText: "",
  },

  async onLoad() {
    await this.loadBootstrap();
    this.loadTemplates();
  },

  async loadBootstrap() {
    const bootstrap = await getBootstrap();
    this.setData({
      childId: bootstrap.defaultChild ? bootstrap.defaultChild.id : "",
    });
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
          ageText: template.ageMin === null || template.ageMax === null ? "自定义" : `${template.ageMin}-${template.ageMax}岁`,
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

  async onAddTap(event) {
    if (!this.data.childId || this.data.addingSlug) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }

    const templateId = event.currentTarget.dataset.templateId;
    const slug = event.currentTarget.dataset.slug;
    this.setData({ addingSlug: slug });
    try {
      await addSystemTemplateToChild(this.data.childId, templateId);
      wx.showToast({ title: "已添加", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "添加失败", icon: "none" });
    } finally {
      this.setData({ addingSlug: "" });
    }
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
    piano: "琴",
    directions_run: "跑",
  };
  return fallbackMap[iconKey] || "习";
}
