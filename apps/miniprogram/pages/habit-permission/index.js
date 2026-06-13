const { listFamilyMembers } = require("../../services/family-service.js");
const { updateChildHabitPermission } = require("../../services/child-habit-service.js");

Page({
  data: {
    familyId: "",
    childId: "",
    childHabitId: "",
    habitName: "",
    permissionType: "ALL_PARENTS",
    allowedMemberIds: [],
    members: [],
    loading: false,
    saving: false,
    errorText: "",
    permissionOptions: [
      { value: "ALL_PARENTS", label: "所有家长", checked: true },
      { value: "OWNER_ONLY", label: "创建人", checked: false },
      { value: "SPECIFIC_PARENTS", label: "指定家长", checked: false },
    ],
  },

  async onLoad(options) {
    const permissionType = options.permissionType || "ALL_PARENTS";
    this.setData({
      familyId: options.familyId || "",
      childId: options.childId || "",
      childHabitId: options.childHabitId || "",
      habitName: decodeURIComponent(options.habitName || ""),
      permissionType,
      permissionOptions: buildPermissionOptions(permissionType),
    });
    await this.loadMembers();
  },

  async loadMembers() {
    this.setData({ loading: true, errorText: "" });
    try {
      const pages = getCurrentPages();
      const previousPage = pages.length > 1 ? pages[pages.length - 2] : null;
      const familyId = this.data.familyId || (previousPage && previousPage.data.familyId ? previousPage.data.familyId : "");
      const members = familyId ? await listFamilyMembers(familyId) : [];
      this.setData({
        members: members.map((member) => ({
          ...member,
          roleText: member.admin ? "主家长" : "成员家长",
          checked: this.data.allowedMemberIds.includes(member.id),
        })),
      });
    } catch (error) {
      this.setData({ errorText: error.message || "成员加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  choosePermission(event) {
    const permissionType = event.currentTarget.dataset.value;
    this.setData({
      permissionType,
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
    if (this.data.permissionType === "SPECIFIC_PARENTS" && this.data.allowedMemberIds.length === 0) {
      wx.showToast({ title: "请选择可打卡家长", icon: "none" });
      return;
    }
    this.setData({ saving: true });
    try {
      await updateChildHabitPermission(this.data.childId, this.data.childHabitId, {
        permissionType: this.data.permissionType,
        allowedMemberIds: this.data.allowedMemberIds,
      });
      wx.showToast({ title: "已保存", icon: "success" });
      wx.navigateBack();
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },
});

function buildPermissionOptions(permissionType) {
  return [
    { value: "ALL_PARENTS", label: "所有家长", checked: permissionType === "ALL_PARENTS" },
    { value: "OWNER_ONLY", label: "创建人", checked: permissionType === "OWNER_ONLY" },
    { value: "SPECIFIC_PARENTS", label: "指定家长", checked: permissionType === "SPECIFIC_PARENTS" },
  ];
}
