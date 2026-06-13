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
          admin: Boolean(session.member.admin),
        },
      ]
    : [];

  return {
    user: session.user,
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
    admin: true,
    displayName: "我",
  };
  const inviteCode = {
    code: "123456",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  };

  saveMockSession({
    ...getMockSession(),
    family,
    child,
    member,
    inviteCode,
  });

  return ok({ family, child, member, inviteCode });
}

function joinFamily(data) {
  const inviteCode = String(data.inviteCode || "").trim();

  if (!/^\d{6}$/.test(inviteCode)) {
    return fail("请输入 6 位邀请码");
  }

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
  const member = {
    id: "member_mock_joined",
    admin: false,
    displayName: "我",
  };

  saveMockSession({
    ...getMockSession(),
    family,
    child,
    member,
  });

  return ok({ family, child, member });
}

function getFamilyInvite() {
  const session = getMockSession();
  return ok(session.inviteCode || {
    code: "123456",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  });
}

function refreshFamilyInvite() {
  const nextInviteCode = {
    code: "654321",
    status: "active",
    expiresTime: "2026-06-20T12:00:00",
  };
  saveMockSession({
    ...getMockSession(),
    inviteCode: nextInviteCode,
  });
  return ok(nextInviteCode);
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
