const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const { listFamilyMembers } = require("../../services/family-service.js");

Page({
  data: {
    familyId: "",
    familyName: "",
    isFamilyAdmin: false,
    members: [],
    memberCount: 0,
    loading: false,
    errorText: "",
  },

  async onShow() {
    await this.loadMembers();
  },

  async loadMembers() {
    this.setData({ loading: true, errorText: "" });
    try {
      const bootstrap = await getBootstrap();
      const family = bootstrap.defaultFamily;
      if (!family) {
        this.setData({ familyId: "", familyName: "", isFamilyAdmin: false, members: [], memberCount: 0 });
        return;
      }
      const members = await listFamilyMembers(family.id);
      const displayMembers = members.map((member) => ({
        ...member,
        avatarText: String(member.displayName || "家").slice(0, 1),
        roleText: member.admin ? "主家长" : "成员家长",
      }));
      this.setData({
        familyId: family.id,
        familyName: family.name,
        isFamilyAdmin: Boolean(family.admin),
        members: displayMembers,
        memberCount: displayMembers.length,
      });
    } catch (error) {
      this.setData({ errorText: error.message || "成员加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goFamilyInvite() {
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可邀请成员", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_INVITE });
  },
});
