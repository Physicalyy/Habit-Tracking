const {
  API_ENDPOINTS,
  familyInvite,
  refreshFamilyInvite,
  familyMembers,
} = require("../core/api.js");
const { request } = require("../utils/request.js");

async function createFamily(payload) {
  const result = await request(API_ENDPOINTS.CREATE_FAMILY, {
    name: String(payload.name || payload.familyName || "").trim(),
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

async function getFamilyInvite(familyId) {
  const result = await request(familyInvite(familyId));
  return result.data;
}

async function refreshFamilyInviteCode(familyId) {
  const result = await request(refreshFamilyInvite(familyId));
  return result.data;
}

async function listFamilyMembers(familyId) {
  const result = await request(familyMembers(familyId));
  return result.data;
}

module.exports = {
  createFamily,
  joinFamily,
  getFamilyInvite,
  refreshFamilyInvite: refreshFamilyInviteCode,
  listFamilyMembers,
};
