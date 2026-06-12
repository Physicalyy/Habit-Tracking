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
          role: session.member.role,
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
  const familyName = String(data.familyName || "").trim();
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
    role: "OWNER",
  };
  const child = {
    id: "child_mock_created",
    familyId: family.id,
    nickname: childNickname,
  };
  const member = {
    id: "member_mock_owner",
    role: "OWNER",
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

function joinFamily(data) {
  const inviteCode = String(data.inviteCode || "").trim();

  if (!/^\d{6}$/.test(inviteCode)) {
    return fail("请输入 6 位邀请码");
  }

  const family = {
    id: "family_mock_joined",
    name: "阳光家庭",
    role: "MEMBER",
  };
  const child = {
    id: "child_mock_joined",
    familyId: family.id,
    nickname: "小朋友",
  };
  const member = {
    id: "member_mock_joined",
    role: "MEMBER",
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

  return {
    code: "NOT_FOUND",
    message: "未配置的 mock 接口",
    data: null,
  };
}

module.exports = {
  handleMockRequest,
};
