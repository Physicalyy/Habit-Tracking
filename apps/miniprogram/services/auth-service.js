const { API_ENDPOINTS } = require("../core/api.js");
const { request } = require("../utils/request.js");

async function wechatLogin(code) {
  const result = await request(API_ENDPOINTS.WECHAT_LOGIN, { code });
  return result.data;
}

module.exports = {
  wechatLogin,
};
