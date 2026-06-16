const { ROUTES } = require("../../core/routes.js");
const {
  addSystemTemplateToChild,
  listChildHabits,
} = require("../../services/child-habit-service.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const { listHabitTemplates } = require("../../services/habit-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

const categories = [
  { key: "", label: "全部" },
  { key: "HEALTH", label: "健康卫生" },
  { key: "LIFE_SKILLS", label: "生活自理" },
  { key: "LEARNING", label: "学习成长" },
  { key: "SPORTS", label: "运动锻炼" },
  { key: "SOCIAL_EMOTION", label: "社交情绪" },
  { key: "SAFETY", label: "安全教育" },
];

const icons = {
  arrowBack: "\ue5c4",
  search: "\ue8b6",
  add: "\ue145",
  check: "\ue5ca",
};

const iconSymbols = {
  dentistry: "\ue3ae",
  soap: "\ue764",
  water_drop: "\ue798",
  bedtime: "\uea3e",
  bed: "\uea3e",
  toys: "\uf0ff",
  desk: "\uea19",
  backpack: "\uea19",
  menu_book: "\uea19",
  assignment: "\uea19",
  history_edu: "\uea3e",
  draw: "\ue3ae",
  sports_gymnastics: "\ue566",
  nature_people: "\ue566",
  visibility: "\ue8b6",
  directions_run: "\ue566",
  volunteer_activism: "\ue764",
  chat: "\ue764",
  groups: "\ue764",
  self_improvement: "\ue764",
  traffic: "\ue566",
  shield: "\ue764",
  phone: "\ue764",
  power_off: "\ue764",
};

Page({
  data: {
    categories: buildCategories(""),
    selectedCategory: "",
    searchKeyword: "",
    childId: "",
    hasFamily: false,
    templates: [],
    templateCards: [],
    hasTemplates: false,
    loading: false,
    loadRequestSeq: 0,
    addingSlug: "",
    addedTemplateIds: [],
    errorText: "",
    icons,
    ...buildNavState({ title: "习惯库", showBack: true }),
  },

  async onLoad() {
    await this.loadBootstrap();
    this.loadTemplates();
  },

  async loadBootstrap() {
    const bootstrap = await getBootstrap();
    const childId = bootstrap.defaultChild ? bootstrap.defaultChild.id : "";
    let addedTemplateIds = [];
    if (childId) {
      try {
        const childHabits = await listChildHabits(bootstrap.defaultChild.id);
        addedTemplateIds = childHabits
          .map((habit) => habit.templateId)
          .filter((templateId) => templateId !== null && templateId !== undefined)
          .map((templateId) => String(templateId));
      } catch (error) {
        addedTemplateIds = [];
      }
    }
    this.setData({
      childId,
      hasFamily: Boolean(bootstrap.defaultFamily && bootstrap.defaultChild),
      addedTemplateIds,
    });
  },

  async loadTemplates() {
    const requestSeq = this.data.loadRequestSeq + 1;
    this.setData({
      loading: true,
      errorText: "",
      loadRequestSeq: requestSeq,
      templates: [],
      templateCards: [],
      hasTemplates: false,
    });
    try {
      const templates = await listHabitTemplates({
        category: this.data.selectedCategory,
        keyword: this.data.searchKeyword,
        sourceType: "SYSTEM",
      });
      if (requestSeq !== this.data.loadRequestSeq) {
        return;
      }
      this.setTemplateState(templates);
    } catch (error) {
      if (requestSeq !== this.data.loadRequestSeq) {
        return;
      }
      this.setData({ errorText: error.message || "习惯库加载失败" });
    } finally {
      if (requestSeq === this.data.loadRequestSeq) {
        this.setData({ loading: false });
      }
    }
  },

  setTemplateState(templates) {
    const templateCards = templates.map((template, index) => toTemplateCard(template, index, this.data.addingSlug, this.data.addedTemplateIds));
    this.setData({
      templates,
      templateCards,
      hasTemplates: templateCards.length > 0,
    });
  },

  goBack() {
    goBackWithFallback(ROUTES.TODAY, true);
  },

  goCustomHabit() {
    if (!this.data.hasFamily) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.CUSTOM_HABIT });
  },

  onCategoryTap(event) {
    const selectedCategory = event.currentTarget.dataset.category || "";
    this.setData({
      selectedCategory,
      categories: buildCategories(selectedCategory),
    });
    this.loadTemplates();
  },

  onSearchInput(event) {
    this.setData({ searchKeyword: event.detail.value || "" });
    this.loadTemplates();
  },

  async onAddTap(event) {
    if (this.data.addingSlug) {
      return;
    }
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }

    const templateId = event.currentTarget.dataset.templateId;
    if (this.data.addedTemplateIds.includes(String(templateId))) {
      return;
    }
    const slug = event.currentTarget.dataset.slug;
    this.setData({ addingSlug: slug });
    this.setTemplateState(this.data.templates);
    try {
      await addSystemTemplateToChild(this.data.childId, templateId);
      this.setData({
        addedTemplateIds: [...this.data.addedTemplateIds, String(templateId)],
      });
      wx.showToast({ title: "已添加", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "添加失败", icon: "none" });
    } finally {
      this.setData({ addingSlug: "" });
      this.setTemplateState(this.data.templates);
    }
  },
});

function buildCategories(selectedCategory) {
  return categories.map((category) => ({
    ...category,
    active: category.key === selectedCategory,
    className: category.key === selectedCategory ? "category-pill category-active" : "category-pill",
  }));
}

function toTemplateCard(template, index, addingSlug, addedTemplateIds) {
  const palette = index % 3;
  const added = addedTemplateIds.includes(String(template.id));
  const adding = addingSlug === template.slug;
  return {
    ...template,
    imageUrl: normalizeAssetPath(template.imageUrl),
    ageText: buildAgeText(template.ageMin, template.ageMax),
    shortDescription: buildShortDescription(template.description),
    iconSymbol: iconSymbol(template.iconKey),
    adding,
    added,
    addIcon: added || adding ? icons.check : icons.add,
    addText: added || adding ? "已添加" : "添加",
    addClass: added ? "template-add-button template-add-button-added" : "template-add-button",
    accentClass: palette === 1 ? "accent-secondary" : palette === 2 ? "accent-tertiary" : "",
    iconShellClass: palette === 1 ? "icon-shell-secondary" : palette === 2 ? "icon-shell-tertiary" : "",
    iconToneClass: palette === 1 ? "icon-tone-secondary" : palette === 2 ? "icon-tone-tertiary" : "",
  };
}

function buildAgeText(ageMin, ageMax) {
  if (ageMin === null || ageMin === undefined || ageMax === null || ageMax === undefined) {
    return "";
  }
  return `${ageMin}-${ageMax}岁`;
}

function buildShortDescription(description) {
  const value = String(description || "").trim();
  return value.length > 14 ? `${value.slice(0, 14)}...` : value;
}

function iconSymbol(iconKey) {
  return iconSymbols[iconKey] || "\ue145";
}
