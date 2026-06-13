const API_ENDPOINTS = Object.freeze({
  WECHAT_LOGIN: Object.freeze({
    method: "POST",
    path: "/api/auth/wechat-login",
  }),
  ME_BOOTSTRAP: Object.freeze({
    method: "GET",
    path: "/api/me/bootstrap",
  }),
  CREATE_FAMILY: Object.freeze({
    method: "POST",
    path: "/api/families",
  }),
  JOIN_FAMILY: Object.freeze({
    method: "POST",
    path: "/api/families/join",
  }),
  HABIT_TEMPLATES: Object.freeze({
    method: "GET",
    path: "/api/habit-templates",
  }),
});

function familyInvite(familyId) {
  return Object.freeze({
    method: "GET",
    path: `/api/families/${familyId}/invite`,
  });
}

function refreshFamilyInvite(familyId) {
  return Object.freeze({
    method: "POST",
    path: `/api/families/${familyId}/invite/refresh`,
  });
}

module.exports = {
  API_ENDPOINTS,
  familyInvite,
  refreshFamilyInvite,
};
