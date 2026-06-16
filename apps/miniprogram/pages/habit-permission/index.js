const { listFamilyMembers } = require("../../services/family-service.js");
const { updateChildHabitPermission } = require("../../services/child-habit-service.js");
const { ROUTES } = require("../../core/routes.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    familyId: "",
    childId: "",
    childHabitId: "",
    habitName: "",
    permissionType: "ALL_PARENTS",
    showSpecificParents: false,
    allowedMemberIds: [],
    members: [],
    loading: false,
    saving: false,
    saveClass: "save-action",
    errorText: "",
    icons: {
      arrowBack: "\ue5e0",
      verifiedUser: "\ue8e8",
      expandMore: "\ue5cf",
      checkCircle: "\ue86c",
    },
    permissionOptions: buildPermissionOptions("ALL_PARENTS"),
    ...buildNavState({ title: "权限设置", showBack: true }),
  },

  async onLoad(options) {
    const permissionType = options.permissionType || "ALL_PARENTS";
    const allowedMemberIds = parseAllowedMemberIds(options.allowedMemberIds || "");
    this.setData({
      familyId: options.familyId || "",
      childId: options.childId || "",
      childHabitId: options.childHabitId || "",
      habitName: decodeURIComponent(options.habitName || ""),
      permissionType,
      showSpecificParents: permissionType === "SPECIFIC_PARENTS",
      allowedMemberIds,
      permissionOptions: buildPermissionOptions(permissionType),
    });
    await this.loadMembers();
  },

  async loadMembers() {
    this.setData({
      loading: true,
      errorText: "",
      members: [],
      saving: false,
      saveClass: "save-action",
    });
    try {
      const pages = getCurrentPages();
      const previousPage = pages.length > 1 ? pages[pages.length - 2] : null;
      const familyId = this.data.familyId || (previousPage && previousPage.data.familyId ? previousPage.data.familyId : "");
      const members = familyId ? await listFamilyMembers(familyId) : [];
      this.setData({
        members: members.map((member) => ({
          ...member,
          roleText: member.admin ? "主家长" : "成员家长",
          avatarText: String(member.displayName || "家").slice(0, 1),
          checked: this.data.allowedMemberIds.includes(String(member.id)),
        })),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "成员加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    goBackWithFallback(ROUTES.HABIT_MANAGE);
  },

  choosePermission(event) {
    const permissionType = event.currentTarget.dataset.value;
    this.setData({
      permissionType,
      showSpecificParents: permissionType === "SPECIFIC_PARENTS",
      permissionOptions: buildPermissionOptions(permissionType),
    });
  },

  onMemberChange(event) {
    const allowedMemberIds = event.detail.value.map((value) => String(value));
    this.setData({
      allowedMemberIds,
      members: this.data.members.map((member) => ({
        ...member,
        checked: allowedMemberIds.includes(String(member.id)),
      })),
    });
  },

  async savePermission() {
    if (this.data.saving) {
      return;
    }
    if (!this.data.childId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.childHabitId) {
      wx.showToast({ title: "请先选择习惯", icon: "none" });
      return;
    }
    if (this.data.permissionType === "SPECIFIC_PARENTS" && this.data.allowedMemberIds.length === 0) {
      wx.showToast({ title: "请选择可打卡家长", icon: "none" });
      return;
    }
    this.setData({
      saving: true,
      saveClass: "save-action action-disabled",
    });
    try {
      await updateChildHabitPermission(this.data.childId, this.data.childHabitId, {
        permissionType: this.data.permissionType,
        allowedMemberIds: this.data.permissionType === "SPECIFIC_PARENTS" ? this.data.allowedMemberIds : [],
      });
      wx.showToast({ title: "已保存", icon: "success" });
      wx.navigateBack();
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({
        saving: false,
        saveClass: "save-action",
      });
    }
  },
});

function buildPermissionOptions(permissionType) {
  return [
    toPermissionOption("ALL_PARENTS", "全家长可打卡（默认）", permissionType),
    toPermissionOption("OWNER_ONLY", "仅我可打卡", permissionType),
    toPermissionOption("SPECIFIC_PARENTS", "指定家长可打卡", permissionType),
  ];
}

function toPermissionOption(value, label, selectedValue) {
  const checked = value === selectedValue;
  return {
    value,
    label,
    checked,
    optionClass: checked ? "permission-option permission-option-active" : "permission-option",
    radioClass: checked ? "option-radio option-radio-active" : "option-radio",
  };
}

function parseAllowedMemberIds(value) {
  return decodeURIComponent(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
