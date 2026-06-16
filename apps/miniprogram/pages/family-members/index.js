const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const { listFamilyMembers } = require("../../services/family-service.js");
const { buildNavState, goBackWithFallback } = require("../../utils/navigation-bar.js");

Page({
  data: {
    familyId: "",
    familyName: "",
    childNickname: "",
    roleText: "",
    isFamilyAdmin: false,
    inviteActionClass: "invite-primary action-disabled",
    members: [],
    memberCount: 0,
    loading: false,
    errorText: "",
    icons: {
      arrowBack: "\ue5e0",
      bubbleChart: "\ue6dd",
      notifications: "\ue7f4",
      child: "\ue7fd",
      personAdd: "\ue7fe",
    },
    ...buildNavState({ title: "家庭成员", showBack: true }),
  },

  async onShow() {
    await this.loadMembers();
  },

  goBack() {
    goBackWithFallback(ROUTES.ME, true);
  },

  async loadMembers() {
    this.setData({
      loading: true,
      errorText: "",
      familyId: "",
      familyName: "",
      childNickname: "",
      roleText: "",
      isFamilyAdmin: false,
      inviteActionClass: "invite-primary action-disabled",
      members: [],
      memberCount: 0,
    });
    try {
      const bootstrap = await getBootstrap();
      const family = bootstrap.defaultFamily;
      if (!family) {
        return;
      }
      const child = bootstrap.defaultChild;
      const members = await listFamilyMembers(family.id);
      const displayMembers = members.map((member) => ({
        ...member,
        avatarText: String(member.displayName || "家").slice(0, 1),
        roleText: member.admin ? "主家长" : "成员家长",
        memberDesc: member.admin ? "可管理家庭、习惯和权限" : "可参与打卡和查看记录",
        accentClass: member.admin ? "admin" : "member",
      }));
      this.setData({
        familyId: family.id,
        familyName: family.name,
        childNickname: child ? child.nickname : "未选择孩子",
        roleText: family.admin ? "主家长" : "成员家长",
        isFamilyAdmin: Boolean(family.admin),
        inviteActionClass: family.admin ? "invite-primary" : "invite-primary action-disabled",
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
    if (!this.data.familyId) {
      wx.showToast({ title: "请先加入家庭", icon: "none" });
      return;
    }
    if (!this.data.isFamilyAdmin) {
      wx.showToast({ title: "仅主家长可邀请成员", icon: "none" });
      return;
    }
    wx.navigateTo({ url: ROUTES.FAMILY_INVITE });
  },
});
