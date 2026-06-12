const { API_ENDPOINTS } = require("../core/api.js");
const { request } = require("../utils/request.js");

async function createFamily(payload) {
  const result = await request(API_ENDPOINTS.CREATE_FAMILY, {
    familyName: String(payload.familyName || "").trim(),
    childNickname: String(payload.childNickname || "").trim(),
  });
  return result.data;
}

async function joinFamily(payload) {
  const result = await request(API_ENDPOINTS.JOIN_FAMILY, {
    inviteCode: String(payload.inviteCode || "").trim(),
  });
  return result.data;
}

module.exports = {
  createFamily,
  joinFamily,
};
