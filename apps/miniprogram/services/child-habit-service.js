const {
  API_ENDPOINTS,
  addChildHabit,
  childHabit,
  childHabits,
  deleteChildHabit,
  childHabitPermissions,
  childHabitStatus,
} = require("../core/api.js");
const { request } = require("../utils/request.js");

async function listChildHabits(childId) {
  const result = await request(childHabits(childId));
  return result.data;
}

async function addSystemTemplateToChild(childId, templateId) {
  const result = await request(addChildHabit(childId), { templateId });
  return result.data;
}

async function createCustomHabit(data) {
  const result = await request(API_ENDPOINTS.CUSTOM_HABIT_TEMPLATE, {
    childId: data.childId,
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    category: String(data.category || "").trim(),
    iconKey: String(data.iconKey || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
  });
  return result.data;
}

async function updateChildHabit(childId, childHabitId, data) {
  const result = await request(childHabit(childId, childHabitId), {
    name: String(data.name || "").trim(),
    description: String(data.description || "").trim(),
    iconKey: String(data.iconKey || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
  });
  return result.data;
}

async function updateChildHabitStatus(childId, childHabitId, status) {
  const result = await request(childHabitStatus(childId, childHabitId), {
    status,
  });
  return result.data;
}

async function removeChildHabit(childId, childHabitId) {
  const result = await request(deleteChildHabit(childId, childHabitId));
  return result.data;
}

async function updateChildHabitPermission(childId, childHabitId, data) {
  const result = await request(childHabitPermissions(childId, childHabitId), {
    permissionType: String(data.permissionType || "").trim(),
    allowedMemberIds: Array.isArray(data.allowedMemberIds)
      ? data.allowedMemberIds
      : [],
  });
  return result.data;
}

module.exports = {
  listChildHabits,
  addSystemTemplateToChild,
  createCustomHabit,
  updateChildHabit,
  updateChildHabitStatus,
  removeChildHabit,
  updateChildHabitPermission,
};
