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
  CUSTOM_HABIT_TEMPLATE: Object.freeze({
    method: "POST",
    path: "/api/habit-templates/custom",
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

function familyMembers(familyId) {
  return Object.freeze({
    method: "GET",
    path: `/api/families/${familyId}/members`,
  });
}

function childHabits(childId) {
  return Object.freeze({
    method: "GET",
    path: `/api/children/${childId}/habits`,
  });
}

function addChildHabit(childId) {
  return Object.freeze({
    method: "POST",
    path: `/api/children/${childId}/habits`,
  });
}

function childHabit(childId, childHabitId) {
  return Object.freeze({
    method: "PATCH",
    path: `/api/children/${childId}/habits/${childHabitId}`,
  });
}

function childHabitStatus(childId, childHabitId) {
  return Object.freeze({
    method: "PATCH",
    path: `/api/children/${childId}/habits/${childHabitId}/status`,
  });
}

function childHabitPermissions(childId, childHabitId) {
  return Object.freeze({
    method: "PUT",
    path: `/api/children/${childId}/habits/${childHabitId}/permissions`,
  });
}

function todayHabits(childId) {
  return Object.freeze({
    method: "GET",
    path: `/api/children/${childId}/today`,
  });
}

function checkinHabit(childId, childHabitId) {
  return Object.freeze({
    method: "POST",
    path: `/api/children/${childId}/habits/${childHabitId}/checkins`,
  });
}

module.exports = {
  API_ENDPOINTS,
  familyInvite,
  refreshFamilyInvite,
  familyMembers,
  childHabits,
  addChildHabit,
  childHabit,
  childHabitStatus,
  childHabitPermissions,
  todayHabits,
  checkinHabit,
};
