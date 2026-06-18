const { API_ENDPOINTS } = require("../core/api.js");
const { request } = require("../utils/request.js");

async function listHabitTemplates(filters = {}) {
  const result = await request(API_ENDPOINTS.HABIT_TEMPLATES, {
    category: String(filters.category || "").trim(),
    keyword: String(filters.keyword || "").trim(),
    sourceType: String(filters.sourceType || "").trim(),
  });
  return result.data;
}

module.exports = {
  listHabitTemplates,
};
