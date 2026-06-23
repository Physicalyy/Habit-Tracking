const {
  API_ENDPOINTS,
  adoptGrowthPartner,
  childGrowthPartner,
} = require("../core/api.js");
const { request } = require("../utils/request.js");

async function listGrowthPartnerTemplates() {
  const result = await request(API_ENDPOINTS.GROWTH_PARTNER_TEMPLATES);
  return result.data;
}

async function getChildGrowthPartner(childId) {
  const result = await request(childGrowthPartner(childId));
  return result.data;
}

async function adoptChildGrowthPartner(childId, templateCode) {
  const result = await request(adoptGrowthPartner(childId), {
    templateCode: String(templateCode || "").trim(),
  });
  return result.data;
}

module.exports = {
  listGrowthPartnerTemplates,
  getChildGrowthPartner,
  adoptChildGrowthPartner,
};
