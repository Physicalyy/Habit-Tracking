const { API_ENDPOINTS } = require("../core/api.js");
const { getMockSession, saveMockSession } = require("../services/session-state.js");

function ok(data) {
  return {
    code: "OK",
    message: "ok",
    data,
  };
}

function fail(message) {
  return {
    code: "BAD_REQUEST",
    message,
    data: null,
  };
}

const mockHabitTemplates = Object.freeze([
  Object.freeze({
    id: "habit_template_drink_water",
    slug: "drink-water",
    name: "主动喝水",
    category: "HEALTH",
    description: "养成主动喝水的习惯，减少含糖饮料摄入。",
    ageMin: 3,
    ageMax: 12,
    iconKey: "water_drop",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
  Object.freeze({
    id: "habit_template_brush_teeth",
    slug: "brush-teeth",
    name: "早晚刷牙",
    category: "HEALTH",
    description: "每天早晚完成刷牙，建立基础口腔护理习惯。",
    ageMin: 3,
    ageMax: 12,
    iconKey: "soap",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
  Object.freeze({
    id: "habit_template_reading",
    slug: "daily-reading",
    name: "亲子阅读",
    category: "LEARNING",
    description: "每天固定阅读 10 分钟，提升专注和表达。",
    ageMin: 3,
    ageMax: 10,
    iconKey: "menu_book",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
  Object.freeze({
    id: "habit_template_pack_bag",
    slug: "pack-schoolbag",
    name: "整理书包",
    category: "LIFE_SKILLS",
    description: "睡前整理第二天要用的书包和物品。",
    ageMin: 5,
    ageMax: 12,
    iconKey: "assignment",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
  Object.freeze({
    id: "habit_template_jump_rope",
    slug: "jump-rope",
    name: "跳绳练习",
    category: "SPORTS",
    description: "每天完成适量跳绳，提升协调性和体能。",
    ageMin: 5,
    ageMax: 12,
    iconKey: "directions_run",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
  Object.freeze({
    id: "habit_template_traffic_safety",
    slug: "traffic-safety",
    name: "过马路看灯",
    category: "SAFETY",
    description: "过马路前观察红绿灯和车辆，遵守交通规则。",
    ageMin: 4,
    ageMax: 12,
    iconKey: "traffic",
    imageUrl: "",
    sourceType: "SYSTEM",
    status: "active",
  }),
]);

function toBootstrap(session) {
  const families = session.family
    ? [
        {
          id: session.family.id,
          name: session.family.name,
          admin: Boolean(session.member && session.member.admin),
        },
      ]
    : [];

  return {
    currentUser: session.user,
    families,
    defaultFamily: families[0] || null,
    defaultChild: session.child,
    needOnboarding: !session.family,
  };
}

function createFamily(data) {
  const familyName = String(data.name || data.familyName || "").trim();
  const childNickname = String(data.childNickname || "").trim();

  if (!familyName) {
    return fail("请填写家庭名称");
  }

  if (!childNickname) {
    return fail("请填写孩子昵称");
  }

  const session = getMockSession();
  const family = {
    id: "family_mock_created",
    name: familyName,
    admin: true,
  };
  const child = {
    id: "child_mock_created",
    familyId: family.id,
    nickname: childNickname,
  };
  const member = {
    id: "member_mock_owner",
    familyId: family.id,
    userId: session.user.id,
    admin: true,
    displayName: "我",
  };
  const inviteCode = {
    code: "123456",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  };

  saveMockSession({
    ...session,
    family,
    child,
    member,
    inviteCode,
    familyMembers: [member],
  });

  return ok({ family, child, member, inviteCode });
}

function joinFamily(data) {
  const inviteCode = String(data.inviteCode || "").trim();

  if (!/^\d{6}$/.test(inviteCode)) {
    return fail("请输入 6 位邀请码");
  }

  const session = getMockSession();
  const family = {
    id: "family_mock_joined",
    name: "阳光家庭",
    admin: false,
  };
  const child = {
    id: "child_mock_joined",
    familyId: family.id,
    nickname: "小朋友",
  };
  const ownerMember = {
    id: "member_mock_owner",
    familyId: family.id,
    userId: "user_mock_owner",
    admin: true,
    displayName: "主家长",
  };
  const member = {
    id: "member_mock_joined",
    familyId: family.id,
    userId: session.user.id,
    admin: false,
    displayName: "我",
  };

  saveMockSession({
    ...session,
    family,
    child,
    member,
    familyMembers: [ownerMember, member],
  });

  return ok({ family, child, member });
}

function getFamilyInvite() {
  const session = getMockSession();
  if (!session.member || !session.member.admin) {
    return fail("仅主家长可查看邀请码");
  }
  return ok(session.inviteCode || {
    code: "123456",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  });
}

function refreshFamilyInvite() {
  const session = getMockSession();
  if (!session.member || !session.member.admin) {
    return fail("仅主家长可刷新邀请码");
  }
  const nextInviteCode = {
    code: "654321",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  };
  saveMockSession({
    ...session,
    inviteCode: nextInviteCode,
  });
  return ok(nextInviteCode);
}

function listFamilyMembers() {
  const session = getMockSession();
  if (!session.family) {
    return fail("请先加入家庭");
  }
  return ok(session.familyMembers || []);
}

function listHabitTemplates(data) {
  const session = getMockSession();
  const category = String(data.category || "").trim();
  const keyword = String(data.keyword || "").trim().toLowerCase();
  const sourceType = String(data.sourceType || "").trim();

  return ok([...mockHabitTemplates, ...(session.customTemplates || [])].filter((template) => {
    if (template.status !== "active") {
      return false;
    }
    if (category && template.category !== category) {
      return false;
    }
    if (sourceType && template.sourceType !== sourceType) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return (
      template.name.toLowerCase().includes(keyword) ||
      template.description.toLowerCase().includes(keyword) ||
      template.slug.toLowerCase().includes(keyword)
    );
  }));
}

function requireChildSession(childId) {
  const session = getMockSession();
  if (!session.child || String(session.child.id) !== String(childId)) {
    return { error: fail("请先加入家庭") };
  }
  return { session };
}

function toChildHabitFromTemplate(session, template) {
  return {
    id: `child_habit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    familyId: session.family.id,
    childId: session.child.id,
    templateId: template.id,
    name: template.name,
    description: template.description,
    iconKey: template.iconKey,
    imageUrl: template.imageUrl || "",
    permissionType: "ALL_PARENTS",
    allowedMemberIds: [],
    createdByMemberId: session.member.id,
    status: "active",
    sortOrder: 0,
  };
}

function listChildHabits(childId) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  return ok(session.childHabits || []);
}

function todayKey() {
  return "2026-06-13";
}

function canCheckin(habit, session) {
  if (habit.permissionType === "ALL_PARENTS") {
    return true;
  }
  if (habit.permissionType === "OWNER_ONLY") {
    return String(habit.createdByMemberId) === String(session.member.id);
  }
  if (habit.permissionType === "SPECIFIC_PARENTS") {
    return (habit.allowedMemberIds || []).map((id) => String(id)).includes(String(session.member.id));
  }
  return false;
}

function toTodayHabit(habit, session) {
  const record = (session.checkins || []).find((item) => (
    String(item.childHabitId) === String(habit.id) &&
    item.checkinDate === todayKey()
  ));
  return {
    childHabitId: habit.id,
    childId: habit.childId,
    name: habit.name,
    description: habit.description,
    iconKey: habit.iconKey,
    imageUrl: habit.imageUrl || "",
    permissionType: habit.permissionType,
    canCheckin: canCheckin(habit, session),
    checked: Boolean(record),
    checkinId: record ? record.id : null,
    checkedByMemberId: record ? record.checkedByMemberId : null,
    checkinDate: record ? record.checkinDate : null,
    checkedTime: record ? record.checkedTime : null,
  };
}

function listTodayHabits(childId) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  return ok((session.childHabits || [])
    .filter((habit) => habit.status === "active")
    .map((habit) => toTodayHabit(habit, session)));
}

function addChildHabit(childId, data) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }

  const templateId = String(data.templateId || "");
  const templates = [...mockHabitTemplates, ...(session.customTemplates || [])];
  const template = templates.find((item) => String(item.id) === templateId && item.status === "active");
  if (!template) {
    return fail("习惯模板不存在");
  }

  const childHabits = session.childHabits || [];
  if (childHabits.some((item) => String(item.templateId) === templateId)) {
    return fail("该习惯已添加");
  }

  const childHabit = toChildHabitFromTemplate(session, template);
  saveMockSession({
    ...session,
    childHabits: [...childHabits, childHabit],
  });
  return ok(childHabit);
}

function updateChildHabit(childId, childHabitId, data) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }

  let updated = null;
  const childHabits = (session.childHabits || []).map((habit) => {
    if (String(habit.id) !== String(childHabitId)) {
      return habit;
    }
    updated = {
      ...habit,
      name: String(data.name || habit.name).trim(),
      description: String(data.description || "").trim(),
      iconKey: String(data.iconKey || habit.iconKey || "").trim(),
      imageUrl: String(data.imageUrl || "").trim(),
    };
    return updated;
  });
  if (!updated) {
    return fail("孩子习惯不存在");
  }

  saveMockSession({ ...session, childHabits });
  return ok(updated);
}

function updateChildHabitStatus(childId, childHabitId, data) {
  const status = String(data.status || "").trim();
  if (status !== "active" && status !== "disabled") {
    return fail("习惯状态无效");
  }

  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }

  let updated = null;
  const childHabits = (session.childHabits || []).map((habit) => {
    if (String(habit.id) !== String(childHabitId)) {
      return habit;
    }
    updated = { ...habit, status };
    return updated;
  });
  if (!updated) {
    return fail("孩子习惯不存在");
  }

  saveMockSession({ ...session, childHabits });
  return ok(updated);
}

function updateChildHabitPermission(childId, childHabitId, data) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  if (!session.member || !session.member.admin) {
    return fail("仅主家长可编辑习惯权限");
  }

  const permissionType = String(data.permissionType || "").trim();
  if (!["ALL_PARENTS", "OWNER_ONLY", "SPECIFIC_PARENTS"].includes(permissionType)) {
    return fail("习惯权限类型无效");
  }

  const allowedMemberIds = permissionType === "SPECIFIC_PARENTS"
    ? Array.from(new Set((data.allowedMemberIds || []).map((id) => String(id))))
    : [];
  if (permissionType === "SPECIFIC_PARENTS" && allowedMemberIds.length === 0) {
    return fail("请选择可打卡家长");
  }

  let updated = null;
  const childHabits = (session.childHabits || []).map((habit) => {
    if (String(habit.id) !== String(childHabitId)) {
      return habit;
    }
    updated = {
      ...habit,
      permissionType,
      allowedMemberIds,
    };
    return updated;
  });
  if (!updated) {
    return fail("孩子习惯不存在");
  }

  saveMockSession({ ...session, childHabits });
  return ok({
    childHabitId,
    childId,
    permissionType,
    allowedMemberIds,
  });
}

function checkinHabit(childId, childHabitId) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  const habit = (session.childHabits || []).find((item) => (
    String(item.id) === String(childHabitId) &&
    item.status === "active"
  ));
  if (!habit) {
    return fail("孩子习惯不存在或已停用");
  }
  if (!canCheckin(habit, session)) {
    return fail("当前家长无打卡权限");
  }
  const existing = (session.checkins || []).find((item) => (
    String(item.childHabitId) === String(childHabitId) &&
    item.checkinDate === todayKey()
  ));
  if (existing) {
    return fail("今天已打卡");
  }
  const record = {
    id: `checkin_${Date.now()}`,
    familyId: session.family.id,
    childId,
    childHabitId,
    checkinDate: todayKey(),
    checkedByMemberId: session.member.id,
    checkedTime: "2026-06-13T12:00:00",
  };
  const nextSession = {
    ...session,
    checkins: [...(session.checkins || []), record],
  };
  saveMockSession(nextSession);
  return ok(toTodayHabit(habit, nextSession));
}

function toHistoryItem(record, habit) {
  return {
    checkinId: record.id,
    childId: record.childId,
    childHabitId: record.childHabitId,
    habitName: habit ? habit.name : "已删除习惯",
    description: habit ? habit.description : "",
    iconKey: habit ? habit.iconKey : "",
    imageUrl: habit ? habit.imageUrl || "" : "",
    checkinDate: record.checkinDate,
    checkedTime: record.checkedTime,
    checkedByMemberId: record.checkedByMemberId,
    note: record.note || "",
  };
}

function listCheckinHistory(childId) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  const childHabits = session.childHabits || [];
  return ok((session.checkins || [])
    .filter((record) => String(record.childId) === String(childId))
    .sort((left, right) => {
      if (left.checkinDate !== right.checkinDate) {
        return left.checkinDate < right.checkinDate ? 1 : -1;
      }
      return left.checkedTime < right.checkedTime ? 1 : -1;
    })
    .map((record) => toHistoryItem(
      record,
      childHabits.find((habit) => String(habit.id) === String(record.childHabitId)),
    )));
}

function getCheckinSummary(childId) {
  const { session, error } = requireChildSession(childId);
  if (error) {
    return error;
  }
  const checkins = (session.checkins || []).filter((record) => String(record.childId) === String(childId));
  return ok({
    childId,
    totalCheckinCount: checkins.length,
    totalCheckinDays: new Set(checkins.map((record) => record.checkinDate)).size,
  });
}

function createCustomHabit(data) {
  const { session, error } = requireChildSession(data.childId);
  if (error) {
    return error;
  }

  const name = String(data.name || "").trim();
  if (!name) {
    return fail("请填写习惯名称");
  }

  const template = {
    id: `custom_template_${Date.now()}`,
    slug: `custom-${Date.now()}`,
    name,
    category: String(data.category || "CUSTOM").trim(),
    description: String(data.description || "").trim(),
    ageMin: null,
    ageMax: null,
    iconKey: String(data.iconKey || "assignment").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    sourceType: "CUSTOM",
    familyId: session.family.id,
    createdByMemberId: session.member.id,
    status: "active",
  };
  const childHabit = toChildHabitFromTemplate(session, template);
  saveMockSession({
    ...session,
    customTemplates: [...(session.customTemplates || []), template],
    childHabits: [...(session.childHabits || []), childHabit],
  });

  return ok({ template, childHabit });
}

async function handleMockRequest({ endpoint, data = {} }) {
  const session = getMockSession();

  if (endpoint === API_ENDPOINTS.WECHAT_LOGIN) {
    return ok({
      token: session.token,
      user: session.user,
    });
  }

  if (endpoint === API_ENDPOINTS.ME_BOOTSTRAP) {
    return ok(toBootstrap(session));
  }

  if (endpoint === API_ENDPOINTS.CREATE_FAMILY) {
    return createFamily(data);
  }

  if (endpoint === API_ENDPOINTS.JOIN_FAMILY) {
    return joinFamily(data);
  }

  if (endpoint === API_ENDPOINTS.HABIT_TEMPLATES) {
    return listHabitTemplates(data);
  }

  if (endpoint === API_ENDPOINTS.CUSTOM_HABIT_TEMPLATE) {
    return createCustomHabit(data);
  }

  if (endpoint.path && endpoint.method === "GET" && /\/api\/children\/[^/]+\/habits$/.test(endpoint.path)) {
    const childId = endpoint.path.match(/\/api\/children\/([^/]+)\/habits$/)[1];
    return listChildHabits(childId);
  }

  if (endpoint.path && endpoint.method === "GET" && /\/api\/children\/[^/]+\/today$/.test(endpoint.path)) {
    const childId = endpoint.path.match(/\/api\/children\/([^/]+)\/today$/)[1];
    return listTodayHabits(childId);
  }

  if (endpoint.path && endpoint.method === "POST" && /\/api\/children\/[^/]+\/habits$/.test(endpoint.path)) {
    const childId = endpoint.path.match(/\/api\/children\/([^/]+)\/habits$/)[1];
    return addChildHabit(childId, data);
  }

  if (endpoint.path && endpoint.method === "PATCH" && /\/api\/children\/[^/]+\/habits\/[^/]+$/.test(endpoint.path)) {
    const [, childId, childHabitId] = endpoint.path.match(/\/api\/children\/([^/]+)\/habits\/([^/]+)$/);
    return updateChildHabit(childId, childHabitId, data);
  }

  if (endpoint.path && endpoint.method === "PATCH" && /\/api\/children\/[^/]+\/habits\/[^/]+\/status$/.test(endpoint.path)) {
    const [, childId, childHabitId] = endpoint.path.match(/\/api\/children\/([^/]+)\/habits\/([^/]+)\/status$/);
    return updateChildHabitStatus(childId, childHabitId, data);
  }

  if (endpoint.path && endpoint.method === "PUT" && /\/api\/children\/[^/]+\/habits\/[^/]+\/permissions$/.test(endpoint.path)) {
    const [, childId, childHabitId] = endpoint.path.match(/\/api\/children\/([^/]+)\/habits\/([^/]+)\/permissions$/);
    return updateChildHabitPermission(childId, childHabitId, data);
  }

  if (endpoint.path && endpoint.method === "POST" && /\/api\/children\/[^/]+\/habits\/[^/]+\/checkins$/.test(endpoint.path)) {
    const [, childId, childHabitId] = endpoint.path.match(/\/api\/children\/([^/]+)\/habits\/([^/]+)\/checkins$/);
    return checkinHabit(childId, childHabitId);
  }

  if (endpoint.path && endpoint.method === "GET" && /\/api\/children\/[^/]+\/checkins$/.test(endpoint.path)) {
    const childId = endpoint.path.match(/\/api\/children\/([^/]+)\/checkins$/)[1];
    return listCheckinHistory(childId);
  }

  if (endpoint.path && endpoint.method === "GET" && /\/api\/children\/[^/]+\/checkins\/summary$/.test(endpoint.path)) {
    const childId = endpoint.path.match(/\/api\/children\/([^/]+)\/checkins\/summary$/)[1];
    return getCheckinSummary(childId);
  }

  if (endpoint.path && /\/api\/families\/[^/]+\/members$/.test(endpoint.path)) {
    return listFamilyMembers();
  }

  if (endpoint.path && /\/api\/families\/[^/]+\/invite$/.test(endpoint.path)) {
    return getFamilyInvite();
  }

  if (endpoint.path && /\/api\/families\/[^/]+\/invite\/refresh$/.test(endpoint.path)) {
    return refreshFamilyInvite();
  }

  return {
    code: "NOT_FOUND",
    message: "未配置的 mock 接口",
    data: null,
  };
}

module.exports = {
  handleMockRequest,
};
