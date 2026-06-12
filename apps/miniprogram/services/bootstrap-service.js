const { API_ENDPOINTS } = require("../core/api.js");
const { request } = require("../utils/request.js");

async function getBootstrap() {
  const result = await request(API_ENDPOINTS.ME_BOOTSTRAP);
  return result.data;
}

module.exports = {
  getBootstrap,
};
