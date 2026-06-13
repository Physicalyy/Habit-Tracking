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
